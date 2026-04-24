import { createHash, createHmac, randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { resolveStoredPlanStateForUser } from "@/lib/billing-store"
import type { AccessSnapshot, ActivePlan, PremiumPlanId, QuotaKind } from "@/lib/monetization-types"
import {
  consumeStoredDailyQuota,
  consumeStoredQuotaWithGuardOnce,
  getStoredDailyQuota,
  isQuotaDatabaseConfigured,
} from "@/lib/quota-store"
import { siteConfig } from "@/lib/site-config"
import { getStripe, isStripeConfigured } from "@/lib/stripe"
import { getAuthenticatedUser } from "@/lib/supabase/auth"
import { isSupabaseAuthConfigured } from "@/lib/supabase/config"

const ANONYMOUS_ID_COOKIE = "label2a4_guest"
const LEGACY_ANONYMOUS_ID_COOKIE = "label2a4_device"
const QUOTA_COOKIE = "label2a4_quota"
const EXPORTED_DOCUMENTS_COOKIE = "label2a4_exported"
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

interface ExportedDocumentsCookiePayload {
  v: 1
  anonymousId: string
  dayKey: string
  exportIds: string[]
}

interface AnonymousIdCookiePayload {
  v: 1
  anonymousId: string
  createdAt: string
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
  consumedSheets?: number
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

function getClientIp(request: NextRequest) {
  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim()
  const realIp = request.headers.get("x-real-ip")?.trim()
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()

  return vercelForwardedFor || cloudflareIp || realIp || forwardedFor || "local"
}

function expandIpv6Address(address: string) {
  const parts = address.split("::")

  if (parts.length > 2) {
    return null
  }

  const head = parts[0] ? parts[0].split(":").filter(Boolean) : []
  const tail = parts[1] ? parts[1].split(":").filter(Boolean) : []
  const missingCount = parts.length === 2 ? 8 - head.length - tail.length : 0

  if (missingCount < 0) {
    return null
  }

  const hextets = [...head, ...Array.from({ length: missingCount }, () => "0"), ...tail]

  if (hextets.length !== 8 || hextets.some((hextet) => !/^[0-9a-f]{1,4}$/i.test(hextet))) {
    return null
  }

  return hextets.map((hextet) => hextet.padStart(4, "0"))
}

function normalizeIpForQuota(ip: string) {
  const normalized = ip.trim().toLowerCase().replace(/^\[|\]$/g, "")

  if (!normalized || normalized === "local") {
    return "local"
  }

  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(normalized)) {
    return normalized.split(":")[0]
  }

  if (!normalized.includes(":")) {
    return normalized
  }

  const [address] = normalized.split("%")
  const expanded = expandIpv6Address(address)

  if (!expanded) {
    return address
  }

  // IPv6 privacy addresses often rotate. This network prefix is only used as a coarse anti-abuse guard,
  // never as the primary user identity.
  return `${expanded.slice(0, 4).join(":")}::/64`
}

function getGuestQuotaHash(anonymousId: string) {
  return `guest:${createHash("sha256").update(anonymousId).digest("hex").slice(0, 24)}`
}

function getAnonymousAbuseQuotaHash(request: NextRequest) {
  const networkKey = normalizeIpForQuota(getClientIp(request))

  return `guest-abuse:${createHash("sha256").update(networkKey).digest("hex").slice(0, 24)}`
}

function getAccountQuotaHash(userId: string) {
  return `account:${createHash("sha256").update(userId).digest("hex").slice(0, 24)}`
}

function getQuotaKind(planState: ResolvedPlanState, authState: AuthState): QuotaKind {
  if (planState.isPremium) {
    return "premium"
  }

  return authState.isAuthenticated ? "free-account" : "guest"
}

function getDailyLimitForAuthState(authState: AuthState) {
  return authState.isAuthenticated
    ? siteConfig.pricing.freeAccountDailyA4Sheets
    : siteConfig.pricing.guestDailyA4Sheets
}

function getFreeMaxA4SheetsPerExport() {
  return Math.max(Math.floor(siteConfig.pricing.freeMaxA4SheetsPerExport), 1)
}

function getFreeMaxPdfFilesPerBatch() {
  return Math.max(Math.floor(siteConfig.pricing.freeMaxPdfFilesPerBatch), 1)
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

function buildBaseQuotaState(anonymousId: string, authState: AuthState): QuotaState {
  return {
    dayKey: getDayKey(),
    usedSheets: 0,
    fingerprintHash: authState.userId ? getAccountQuotaHash(authState.userId) : getGuestQuotaHash(anonymousId),
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

function normalizeExportId(exportId?: string | null) {
  const normalized = exportId?.trim()

  if (!normalized || normalized.length > 80 || !/^[a-zA-Z0-9_-]+$/.test(normalized)) {
    return null
  }

  return normalized
}

function readExportedDocumentsCookie(request: NextRequest, anonymousId: string, dayKey: string) {
  const decoded = decodeSignedCookie<ExportedDocumentsCookiePayload>(
    request.cookies.get(EXPORTED_DOCUMENTS_COOKIE)?.value,
  )

  if (!decoded || decoded.v !== 1 || decoded.anonymousId !== anonymousId || decoded.dayKey !== dayKey) {
    return new Set<string>()
  }

  return new Set(
    decoded.exportIds.filter(
      (exportId) => typeof exportId === "string" && Boolean(normalizeExportId(exportId)),
    ),
  )
}

function writeExportedDocumentsCookie(
  response: NextResponse,
  input: { anonymousId: string; dayKey: string; exportIds: Set<string> },
) {
  const exportIds = Array.from(input.exportIds).slice(-80)

  setCookie(
    response,
    EXPORTED_DOCUMENTS_COOKIE,
    encodeSignedCookie<ExportedDocumentsCookiePayload>({
      v: 1,
      anonymousId: input.anonymousId,
      dayKey: input.dayKey,
      exportIds,
    }),
  )
}

async function readQuotaState(
  request: NextRequest,
  anonymousId: string,
  authState: AuthState,
): Promise<QuotaState> {
  const baseQuota = buildBaseQuotaState(anonymousId, authState)

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

function getAdminPremiumEmails() {
  return new Set(
    (process.env.ADMIN_PREMIUM_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

function isAdminPremiumAccount(authState: AuthState) {
  if (!authState.userEmail) {
    return false
  }

  return getAdminPremiumEmails().has(authState.userEmail.toLowerCase())
}

function getStoredPlanCookie(request: NextRequest) {
  return decodeSignedCookie<PlanCookiePayload>(request.cookies.get(PLAN_COOKIE)?.value)
}

function logEvent(event: Record<string, unknown>) {
  console.info("[label2a4]", JSON.stringify({ ts: new Date().toISOString(), ...event }))
}

export function ensureAnonymousId(request: NextRequest, response: NextResponse) {
  const current = decodeSignedCookie<AnonymousIdCookiePayload>(request.cookies.get(ANONYMOUS_ID_COOKIE)?.value)

  if (current?.v === 1 && current.anonymousId) {
    return current.anonymousId
  }

  const legacySigned = decodeSignedCookie<AnonymousIdCookiePayload>(
    request.cookies.get(LEGACY_ANONYMOUS_ID_COOKIE)?.value,
  )

  if (legacySigned?.v === 1 && legacySigned.anonymousId) {
    setCookie(response, ANONYMOUS_ID_COOKIE, encodeSignedCookie(legacySigned))
    return legacySigned.anonymousId
  }

  const legacyRaw = request.cookies.get(LEGACY_ANONYMOUS_ID_COOKIE)?.value

  if (legacyRaw && /^[0-9a-f-]{24,64}$/i.test(legacyRaw)) {
    const payload: AnonymousIdCookiePayload = {
      v: 1,
      anonymousId: legacyRaw,
      createdAt: new Date().toISOString(),
    }
    setCookie(response, ANONYMOUS_ID_COOKIE, encodeSignedCookie(payload))
    return legacyRaw
  }

  const created = randomUUID()
  setCookie(
    response,
    ANONYMOUS_ID_COOKIE,
    encodeSignedCookie<AnonymousIdCookiePayload>({
      v: 1,
      anonymousId: created,
      createdAt: new Date().toISOString(),
    }),
  )
  return created
}

function buildSnapshot(
  anonymousId: string,
  quota: QuotaState,
  planState: ResolvedPlanState,
  authState: AuthState,
): AccessSnapshot {
  const quotaKind = getQuotaKind(planState, authState)
  const limit = getDailyLimitForAuthState(authState)
  const remaining = Math.max(limit - quota.usedSheets, 0)

  return {
    anonymousId,
    userId: authState.userId ?? null,
    userEmail: authState.userEmail ?? null,
    isAuthenticated: authState.isAuthenticated,
    plan: planState.plan,
    isPremium: planState.isPremium,
    quotaKind,
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
  if (authState.isAuthenticated && isAdminPremiumAccount(authState)) {
    return {
      plan: "annual",
      isPremium: true,
      expiresAt: null,
      subscriptionStatus: "admin",
      email: authState.userEmail ?? undefined,
    }
  }

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
  input: {
    action: "download" | "print"
    exportId?: string | null
    fileName?: string
    sheetCount: number
    sourceFileCount?: number
  },
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
  const quotaKind = getQuotaKind(planState, authState)
  const dailyLimit = getDailyLimitForAuthState(authState)
  const exportId = normalizeExportId(input.exportId)

  if (planState.isPremium) {
    logEvent({
      anonymousId,
      plan: planState.plan,
      action: input.action,
      sheetCount: input.sheetCount,
      fileName: input.fileName,
      quotaKind,
      result: "premium-allowed",
    })

    return {
      allowed: true,
      consumedSheets: input.sheetCount,
      snapshot: buildSnapshot(anonymousId, quota, planState, authState),
    }
  }

  if (input.sourceFileCount && input.sourceFileCount > getFreeMaxPdfFilesPerBatch()) {
    logEvent({
      anonymousId,
      plan: "free",
      action: input.action,
      sheetCount: input.sheetCount,
      fileName: input.fileName,
      quotaKind,
      result: "free-file-limit",
      sourceFileCount: input.sourceFileCount,
    })

    return {
      allowed: false,
      reason: "free-file-limit",
      snapshot: buildSnapshot(anonymousId, quota, planState, authState),
    }
  }

  if (input.sheetCount > getFreeMaxA4SheetsPerExport()) {
    logEvent({
      anonymousId,
      plan: "free",
      action: input.action,
      sheetCount: input.sheetCount,
      fileName: input.fileName,
      quotaKind,
      result: "free-sheet-limit",
    })

    return {
      allowed: false,
      reason: "free-sheet-limit",
      snapshot: buildSnapshot(anonymousId, quota, planState, authState),
    }
  }

  if (!exportId) {
    return {
      allowed: false,
      reason: "invalid-export-id",
      snapshot: buildSnapshot(anonymousId, quota, planState, authState),
    }
  }

  if (isQuotaDatabaseConfigured()) {
    const databaseDecision = await consumeStoredQuotaWithGuardOnce({
      action: input.action,
      dayKey: quota.dayKey,
      exportId,
      fileName: input.fileName,
      guardHash: authState.isAuthenticated ? null : getAnonymousAbuseQuotaHash(request),
      guardLimit: authState.isAuthenticated ? null : siteConfig.pricing.anonymousAbuseDailyA4Sheets,
      primaryHash: quota.fingerprintHash,
      primaryLimit: dailyLimit,
      sheetCount: input.sheetCount,
    }).catch(async (error) => {
      console.error("[label2a4-quota-guard-once-fallback]", error)
      const exportedDocuments = readExportedDocumentsCookie(request, anonymousId, quota.dayKey)

      if (exportedDocuments.has(exportId)) {
        return {
          allowed: true,
          alreadyExported: true,
          consumedSheets: 0,
          guardNextUsedSheets: 0,
          guardUsedSheets: 0,
          nextUsedSheets: quota.usedSheets,
          reason: null,
          usedSheets: quota.usedSheets,
        }
      }

      const legacyDecision = await consumeStoredDailyQuota({
        dailyLimit,
        dayKey: quota.dayKey,
        fingerprintHash: quota.fingerprintHash,
        sheetCount: input.sheetCount,
      })

      if (legacyDecision.allowed) {
        exportedDocuments.add(exportId)
        writeExportedDocumentsCookie(response, {
          anonymousId,
          dayKey: quota.dayKey,
          exportIds: exportedDocuments,
        })
      }

      return {
        ...legacyDecision,
        alreadyExported: false,
        consumedSheets: legacyDecision.allowed ? input.sheetCount : 0,
        guardNextUsedSheets: 0,
        guardUsedSheets: 0,
        reason: legacyDecision.allowed ? null : "quota-exceeded",
      }
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
        quotaKind,
        result: databaseDecision.reason === "abuse-limit" ? "abuse-limit" : "quota-exceeded",
        usedSheets: databaseDecision.usedSheets,
      })

      return {
        allowed: false,
        reason: databaseDecision.reason === "abuse-limit" ? "abuse-limit" : "quota-exceeded",
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
      quotaKind,
      result: "free-allowed",
      usedSheets: databaseDecision.nextUsedSheets,
      alreadyExported: databaseDecision.alreadyExported,
      consumedSheets: databaseDecision.consumedSheets,
    })

    return {
      allowed: true,
      consumedSheets: databaseDecision.consumedSheets,
      snapshot: buildSnapshot(anonymousId, nextQuota, planState, authState),
    }
  }

  const exportedDocuments = readExportedDocumentsCookie(request, anonymousId, quota.dayKey)

  if (exportedDocuments.has(exportId)) {
    logEvent({
      anonymousId,
      plan: "free",
      action: input.action,
      sheetCount: input.sheetCount,
      fileName: input.fileName,
      quotaKind,
      result: "free-repeat-allowed",
      usedSheets: quota.usedSheets,
    })

    return {
      allowed: true,
      consumedSheets: 0,
      snapshot: buildSnapshot(anonymousId, quota, planState, authState),
    }
  }

  const nextUsed = quota.usedSheets + input.sheetCount

  if (nextUsed > dailyLimit) {
    logEvent({
      anonymousId,
      plan: "free",
      action: input.action,
      sheetCount: input.sheetCount,
      fileName: input.fileName,
      quotaKind,
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
  exportedDocuments.add(exportId)
  writeExportedDocumentsCookie(response, {
    anonymousId,
    dayKey: quota.dayKey,
    exportIds: exportedDocuments,
  })

  logEvent({
    anonymousId,
    plan: "free",
    action: input.action,
    sheetCount: input.sheetCount,
    fileName: input.fileName,
    quotaKind,
    result: "free-allowed",
    usedSheets: nextUsed,
  })

  return {
    allowed: true,
    consumedSheets: input.sheetCount,
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
