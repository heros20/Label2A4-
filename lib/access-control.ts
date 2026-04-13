import { createHash, createHmac, randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import type { AccessSnapshot, ActivePlan, PremiumPlanId } from "@/lib/monetization-types"
import { siteConfig } from "@/lib/site-config"
import { getStripe, isStripeConfigured } from "@/lib/stripe"

const ANONYMOUS_ID_COOKIE = "label2a4_device"
const QUOTA_COOKIE = "label2a4_quota"
const PLAN_COOKIE = "label2a4_plan"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"])

interface QuotaCookiePayload {
  v: 1
  anonymousId: string
  dayKey: string
  usedSheets: number
  fingerprintHash: string
}

interface PlanCookiePayload {
  v: 1
  anonymousId: string
  planId: PremiumPlanId
  kind: "day-pass" | "subscription"
  customerId?: string
  subscriptionId?: string
  email?: string
  expiresAt?: string | null
}

interface ResolvedPlanState {
  plan: ActivePlan
  isPremium: boolean
  expiresAt?: string | null
  subscriptionStatus?: string | null
  customerId?: string
  subscriptionId?: string
  email?: string
}

interface ExportDecision {
  allowed: boolean
  reason?: string
  snapshot: AccessSnapshot
}

function getSigningSecret() {
  return process.env.QUOTA_SIGNING_SECRET ?? "label2a4-dev-secret"
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url")
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function signPayload(payload: string) {
  return createHmac("sha256", getSigningSecret()).update(payload).digest("base64url")
}

function encodeSignedCookie<T>(value: T) {
  const payload = base64UrlEncode(JSON.stringify(value))
  return `${payload}.${signPayload(payload)}`
}

function decodeSignedCookie<T>(value: string | undefined) {
  if (!value) {
    return null
  }

  const [payload, signature] = value.split(".")
  if (!payload || !signature) {
    return null
  }

  if (signPayload(payload) !== signature) {
    return null
  }

  try {
    return JSON.parse(base64UrlDecode(payload)) as T
  } catch {
    return null
  }
}

function getFingerprintHash(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local"
  const userAgent = request.headers.get("user-agent") ?? "unknown"

  return createHash("sha256").update(`${ip}|${userAgent}`).digest("hex").slice(0, 24)
}

function getDayKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
  }).format(date)
}

function setCookie(response: NextResponse, name: string, value: string, maxAge = COOKIE_MAX_AGE) {
  response.cookies.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  })
}

function deleteCookie(response: NextResponse, name: string) {
  response.cookies.set(name, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}

function buildEmptyQuota(request: NextRequest, anonymousId: string): QuotaCookiePayload {
  return {
    v: 1,
    anonymousId,
    dayKey: getDayKey(),
    usedSheets: 0,
    fingerprintHash: getFingerprintHash(request),
  }
}

function readQuotaState(request: NextRequest, anonymousId: string) {
  const decoded = decodeSignedCookie<QuotaCookiePayload>(request.cookies.get(QUOTA_COOKIE)?.value)
  const emptyQuota = buildEmptyQuota(request, anonymousId)

  if (!decoded) {
    return emptyQuota
  }

  if (
    decoded.v !== 1 ||
    decoded.anonymousId !== anonymousId ||
    decoded.dayKey !== emptyQuota.dayKey ||
    decoded.fingerprintHash !== emptyQuota.fingerprintHash
  ) {
    return emptyQuota
  }

  return decoded
}

function getStoredPlanCookie(request: NextRequest) {
  return decodeSignedCookie<PlanCookiePayload>(request.cookies.get(PLAN_COOKIE)?.value)
}

function logEvent(event: Record<string, unknown>) {
  console.info("[label2a4]", JSON.stringify({ ts: new Date().toISOString(), ...event }))
}

export function ensureAnonymousId(request: NextRequest, response: NextResponse) {
  const current = request.cookies.get(ANONYMOUS_ID_COOKIE)?.value

  if (current) {
    return current
  }

  const created = randomUUID()
  setCookie(response, ANONYMOUS_ID_COOKIE, created)
  return created
}

function buildSnapshot(anonymousId: string, quota: QuotaCookiePayload, planState: ResolvedPlanState): AccessSnapshot {
  const limit = siteConfig.pricing.freeDailyA4Sheets
  const remaining = Math.max(limit - quota.usedSheets, 0)

  return {
    anonymousId,
    plan: planState.plan,
    isPremium: planState.isPremium,
    dayKey: quota.dayKey,
    dailyLimit: limit,
    usedSheetsToday: quota.usedSheets,
    remainingSheetsToday: remaining,
    paymentsAvailable: isStripeConfigured(),
    billingPortalAvailable: planState.isPremium && Boolean(planState.customerId) && isStripeConfigured(),
    expiresAt: planState.expiresAt ?? null,
    subscriptionStatus: planState.subscriptionStatus ?? null,
  }
}

async function resolvePlanState(
  request: NextRequest,
  response: NextResponse,
  anonymousId: string,
): Promise<ResolvedPlanState> {
  const fallback: ResolvedPlanState = {
    plan: "free",
    isPremium: false,
  }

  const storedPlan = getStoredPlanCookie(request)

  if (!storedPlan || storedPlan.v !== 1 || storedPlan.anonymousId !== anonymousId) {
    return fallback
  }

  if (storedPlan.kind === "day-pass") {
    if (storedPlan.expiresAt && new Date(storedPlan.expiresAt).getTime() > Date.now()) {
      return {
        plan: "day-pass",
        isPremium: true,
        expiresAt: storedPlan.expiresAt,
        customerId: storedPlan.customerId,
        email: storedPlan.email,
      }
    }

    deleteCookie(response, PLAN_COOKIE)
    return fallback
  }

  if (!isStripeConfigured() || !storedPlan.subscriptionId) {
    deleteCookie(response, PLAN_COOKIE)
    return fallback
  }

  try {
    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(storedPlan.subscriptionId)

    if (!ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
      deleteCookie(response, PLAN_COOKIE)
      return fallback
    }

    const currentPeriodEnd = subscription.items.data.reduce((latest, item) => {
      return typeof item.current_period_end === "number" ? Math.max(latest, item.current_period_end) : latest
    }, 0)

    const expiresAt = currentPeriodEnd > 0 ? new Date(currentPeriodEnd * 1000).toISOString() : null

    return {
      plan: storedPlan.planId === "annual" ? "annual" : "monthly",
      isPremium: true,
      expiresAt,
      subscriptionStatus: subscription.status,
      customerId:
        storedPlan.customerId ??
        (typeof subscription.customer === "string" ? subscription.customer : undefined),
      subscriptionId: storedPlan.subscriptionId,
      email: storedPlan.email,
    }
  } catch {
    deleteCookie(response, PLAN_COOKIE)
    return fallback
  }
}

export async function getAccessSnapshot(request: NextRequest, response: NextResponse) {
  const anonymousId = ensureAnonymousId(request, response)
  const quota = readQuotaState(request, anonymousId)
  const planState = await resolvePlanState(request, response, anonymousId)
  return buildSnapshot(anonymousId, quota, planState)
}

export async function consumeExportQuota(
  request: NextRequest,
  response: NextResponse,
  input: { action: "download" | "print"; fileName?: string; sheetCount: number },
): Promise<ExportDecision> {
  const anonymousId = ensureAnonymousId(request, response)
  const quota = readQuotaState(request, anonymousId)
  const planState = await resolvePlanState(request, response, anonymousId)

  if (planState.isPremium) {
    logEvent({
      anonymousId,
      plan: planState.plan,
      action: input.action,
      sheetCount: input.sheetCount,
      fileName: input.fileName,
      result: "premium-allowed",
    })

    return {
      allowed: true,
      snapshot: buildSnapshot(anonymousId, quota, planState),
    }
  }

  const nextUsed = quota.usedSheets + input.sheetCount

  if (nextUsed > siteConfig.pricing.freeDailyA4Sheets) {
    logEvent({
      anonymousId,
      plan: "free",
      action: input.action,
      sheetCount: input.sheetCount,
      fileName: input.fileName,
      result: "quota-exceeded",
      usedSheets: quota.usedSheets,
    })

    return {
      allowed: false,
      reason: "quota-exceeded",
      snapshot: buildSnapshot(anonymousId, quota, planState),
    }
  }

  const nextQuota: QuotaCookiePayload = {
    ...quota,
    usedSheets: nextUsed,
  }

  setCookie(response, QUOTA_COOKIE, encodeSignedCookie(nextQuota))

  logEvent({
    anonymousId,
    plan: "free",
    action: input.action,
    sheetCount: input.sheetCount,
    fileName: input.fileName,
    result: "free-allowed",
    usedSheets: nextUsed,
  })

  return {
    allowed: true,
    snapshot: buildSnapshot(anonymousId, nextQuota, planState),
  }
}

export function setDayPassPlanCookie(
  response: NextResponse,
  input: { anonymousId: string; customerId?: string; email?: string; durationHours?: number },
) {
  const expiresAt = new Date(Date.now() + (input.durationHours ?? 24) * 60 * 60 * 1000).toISOString()

  const payload: PlanCookiePayload = {
    v: 1,
    anonymousId: input.anonymousId,
    planId: "day-pass",
    kind: "day-pass",
    customerId: input.customerId,
    email: input.email,
    expiresAt,
  }

  setCookie(response, PLAN_COOKIE, encodeSignedCookie(payload))
}

export function setSubscriptionPlanCookie(
  response: NextResponse,
  input: {
    anonymousId: string
    customerId: string
    subscriptionId: string
    email?: string
    planId: Extract<PremiumPlanId, "monthly" | "annual">
  },
) {
  const payload: PlanCookiePayload = {
    v: 1,
    anonymousId: input.anonymousId,
    planId: input.planId,
    kind: "subscription",
    customerId: input.customerId,
    subscriptionId: input.subscriptionId,
    email: input.email,
  }

  setCookie(response, PLAN_COOKIE, encodeSignedCookie(payload))
}

export function clearPlanCookie(response: NextResponse) {
  deleteCookie(response, PLAN_COOKIE)
}

export function getPlanCookiePayload(request: NextRequest) {
  return getStoredPlanCookie(request)
}

export function getRequestOrigin(request: NextRequest) {
  const protocol = request.headers.get("x-forwarded-proto") ?? "http"
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000"
  return `${protocol}://${host}`
}
