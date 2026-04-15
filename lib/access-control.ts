import { createHash, createHmac, randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { resolveStoredPlanStateForUser } from "@/lib/billing-store"
import type { AccessSnapshot, ActivePlan, PremiumPlanId } from "@/lib/monetization-types"
import { consumeStoredDailyQuota, getStoredDailyQuota, isQuotaDatabaseConfigured } from "@/lib/quota-store"
import { siteConfig } from "@/lib/site-config"
import { getStripe, isStripeConfigured } from "@/lib/stripe"
import { getAuthenticatedUser } from "@/lib/supabase/auth"
import { isSupabaseAuthConfigured } from "@/lib/supabase/config"

const ANONYMOUS_ID_COOKIE = "label2a4_device"
const QUOTA_COOKIE = "label2a4_quota"
const PLAN_COOKIE = "label2a4_plan"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"])

interface QuotaState {
  dayKey: string
  fingerprintHash: string
  usedSheets: number
}

interface QuotaCookiePayload extends QuotaState {
  v: 1
  anonymousId: string
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

interface AuthState {
  isAuthenticated: boolean
  userEmail?: string | null
  userId?: string | null
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
  const acceptLanguage = request.headers.get("accept-language") ?? "unknown"
  const secChUa = request.headers.get("sec-ch-ua") ?? "unknown"
  const secChUaPlatform = request.headers.get("sec-ch-ua-platform") ?? "unknown"

  return createHash("sha256")
    .update(`${ip}|${userAgent}|${acceptLanguage}|${secChUa}|${secChUaPlatform}`)
    .digest("hex")
    .slice(0, 24)
}

function getAccountQuotaHash(userId: string) {
  return `account:${createHash("sha256").update(userId).digest("hex").slice(0, 24)}`
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

function buildBaseQuotaState(request: NextRequest, authState?: AuthState): QuotaState {
  return {
    dayKey: getDayKey(),
    usedSheets: 0,
    fingerprintHash: authState?.userId ? getAccountQuotaHash(authState.userId) : getFingerprintHash(request),
  }
}

function readLegacyQuotaState(request: NextRequest, anonymousId: string, baseQuota: QuotaState) {
  const decoded = decodeSignedCookie<QuotaCookiePayload>(request.cookies.get(QUOTA_COOKIE)?.value)

  if (!decoded) {
    return baseQuota
  }

  if (
    decoded.v !== 1 ||
    decoded.anonymousId !== anonymousId ||
    decoded.dayKey !== baseQuota.dayKey ||
    decoded.fingerprintHash !== baseQuota.fingerprintHash
  ) {
    return baseQuota
  }

  return decoded
}

async function readQuotaState(
  request: NextRequest,
  anonymousId: string,
  authState: AuthState,
): Promise<QuotaState> {
  const baseQuota = buildBaseQuotaState(request, authState)

  if (!isQuotaDatabaseConfigured()) {
    return readLegacyQuotaState(request, anonymousId, baseQuota)
  }

  const storedQuota = await getStoredDailyQuota({
    dayKey: baseQuota.dayKey,
    fingerprintHash: baseQuota.fingerprintHash,
  })

  return {
    ...baseQuota,
    usedSheets: storedQuota.usedSheets,
  }
}

function clearLegacyQuotaCookie(request: NextRequest, response: NextResponse) {
  if (isQuotaDatabaseConfigured() && request.cookies.get(QUOTA_COOKIE)?.value) {
    deleteCookie(response, QUOTA_COOKIE)
  }
}

function buildAuthState(input: { userEmail?: string | null; userId?: string | null }): AuthState {
  return {
    isAuthenticated: Boolean(input.userId),
    userId: input.userId ?? null,
    userEmail: input.userEmail ?? null,
  }
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

function buildSnapshot(
  anonymousId: string,
  quota: QuotaState,
  planState: ResolvedPlanState,
  authState: AuthState,
): AccessSnapshot {
  const limit = siteConfig.pricing.freeDailyA4Sheets
  const remaining = Math.max(limit - quota.usedSheets, 0)

  return {
    anonymousId,
    userId: authState.userId ?? null,
    userEmail: authState.userEmail ?? null,
    isAuthenticated: authState.isAuthenticated,
    plan: planState.plan,
    isPremium: planState.isPremium,
    dayKey: quota.dayKey,
    dailyLimit: limit,
    usedSheetsToday: quota.usedSheets,
    remainingSheetsToday: remaining,
    paymentsAvailable: isStripeConfigured(),
    billingPortalAvailable: Boolean(planState.customerId) && isStripeConfigured(),
    expiresAt: planState.expiresAt ?? null,
    subscriptionStatus: planState.subscriptionStatus ?? null,
  }
}

async function resolvePlanState(
  request: NextRequest,
  response: NextResponse,
  anonymousId: string,
  authState: AuthState,
): Promise<ResolvedPlanState> {
  if (isSupabaseAuthConfigured() && authState.userId) {
    return resolveStoredPlanStateForUser(authState.userId)
  }

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
  clearLegacyQuotaCookie(request, response)
  const authenticatedUser = await getAuthenticatedUser(request, response)
  const authState = buildAuthState({
    userId: authenticatedUser?.id,
    userEmail: authenticatedUser?.email,
  })
  const quota = await readQuotaState(request, anonymousId, authState)
  const planState = await resolvePlanState(request, response, anonymousId, authState)
  return buildSnapshot(anonymousId, quota, planState, authState)
}

export async function consumeExportQuota(
  request: NextRequest,
  response: NextResponse,
  input: { action: "download" | "print"; fileName?: string; sheetCount: number },
): Promise<ExportDecision> {
  const anonymousId = ensureAnonymousId(request, response)
  clearLegacyQuotaCookie(request, response)
  const authenticatedUser = await getAuthenticatedUser(request, response)
  const authState = buildAuthState({
    userId: authenticatedUser?.id,
    userEmail: authenticatedUser?.email,
  })
  const quota = await readQuotaState(request, anonymousId, authState)
  const planState = await resolvePlanState(request, response, anonymousId, authState)

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
      snapshot: buildSnapshot(anonymousId, quota, planState, authState),
    }
  }

  if (isQuotaDatabaseConfigured()) {
    const databaseDecision = await consumeStoredDailyQuota({
      dailyLimit: siteConfig.pricing.freeDailyA4Sheets,
      dayKey: quota.dayKey,
      fingerprintHash: quota.fingerprintHash,
      sheetCount: input.sheetCount,
    })

    if (!databaseDecision.allowed) {
      const currentQuota: QuotaState = {
        ...quota,
        usedSheets: databaseDecision.usedSheets,
      }

      logEvent({
        anonymousId,
        plan: "free",
        action: input.action,
        sheetCount: input.sheetCount,
        fileName: input.fileName,
        result: "quota-exceeded",
        usedSheets: databaseDecision.usedSheets,
      })

      return {
        allowed: false,
        reason: "quota-exceeded",
        snapshot: buildSnapshot(anonymousId, currentQuota, planState, authState),
      }
    }

    const nextQuota: QuotaState = {
      ...quota,
      usedSheets: databaseDecision.nextUsedSheets,
    }

    logEvent({
      anonymousId,
      plan: "free",
      action: input.action,
      sheetCount: input.sheetCount,
      fileName: input.fileName,
      result: "free-allowed",
      usedSheets: databaseDecision.nextUsedSheets,
    })

    return {
      allowed: true,
      snapshot: buildSnapshot(anonymousId, nextQuota, planState, authState),
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
      snapshot: buildSnapshot(anonymousId, quota, planState, authState),
    }
  }

  const nextQuota: QuotaCookiePayload = {
    v: 1,
    anonymousId,
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
    snapshot: buildSnapshot(anonymousId, nextQuota, planState, authState),
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
