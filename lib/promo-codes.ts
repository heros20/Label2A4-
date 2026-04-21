import "server-only"
import { createHash } from "crypto"
import Stripe from "stripe"
import type { PremiumPlanId } from "@/lib/monetization-types"
import type { PromoKind, PromoQuote, PromoValidationPayload, PromoValidationStatus } from "@/lib/promo-types"
import { formatEuroFromCents, siteConfig } from "@/lib/site-config"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { isSupabaseAdminConfigured } from "@/lib/supabase/config"

export interface PromoCodeRecord {
  active: boolean
  applies_to_plans: string[] | null
  code: string
  currency: string
  discount_value: number | null
  expires_at: string | null
  id: string
  kind: PromoKind
  label: string | null
  max_redemptions: number | null
  max_redemptions_per_identity: number | null
  starts_at: string | null
  stripe_coupon_id: string | null
  trial_days: number | null
}

interface PromoReservationRow {
  message: string
  redemption_id: string | null
  status: PromoValidationStatus
}

interface PromoRedemptionCounts {
  identityCount: number
  totalCount: number
}

export interface PromoReservation {
  promo: PromoCodeRecord
  quote: PromoQuote
  redemptionId: string
}

const PENDING_REDEMPTION_TTL_MINUTES = 30

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

export function normalizePromoCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "")
}

export function buildPromoRedeemerHash(input: { anonymousId: string; userId?: string | null }) {
  const scope = input.userId ? `account:${input.userId}` : `guest:${input.anonymousId}`
  return `promo:${hashValue(scope).slice(0, 40)}`
}

export function isPromoStoreConfigured() {
  return isSupabaseAdminConfigured()
}

function getPlanAmountCents(planId: PremiumPlanId) {
  if (planId === "monthly") {
    return siteConfig.pricing.monthlyPriceCents
  }

  if (planId === "annual") {
    return siteConfig.pricing.annualPriceCents
  }

  return siteConfig.pricing.dayPassPriceCents
}

function buildMessage(status: PromoValidationStatus, quote?: PromoQuote) {
  const messages: Record<Exclude<PromoValidationStatus, "valid">, string> = {
    already_used: "Ce code promo a déjà été utilisé pour ce compte ou cet invité.",
    expired: "Ce code promo est expiré.",
    exhausted: "Ce code promo a atteint sa limite d'utilisation.",
    inactive: "Ce code promo n'est pas actif.",
    incompatible_plan: "Ce code promo n'est pas compatible avec cette offre.",
    invalid: "Code promo invalide.",
    not_configured: "Les codes promo ne sont pas encore configurés sur cet environnement.",
    not_started: "Ce code promo n'est pas encore disponible.",
  }

  if (status === "valid") {
    return quote?.message ?? "Code promo appliqué."
  }

  return messages[status]
}

function buildPayload(status: PromoValidationStatus, quote?: PromoQuote): PromoValidationPayload {
  return {
    message: buildMessage(status, quote),
    quote,
    status,
    valid: status === "valid",
  }
}

function isMissingPromoStorageError(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST205" ||
    Boolean(error?.message?.includes("Could not find the table 'public.promo_codes'")) ||
    Boolean(error?.message?.includes("Could not find the table 'public.promo_code_redemptions'"))
  )
}

function buildPromoQuote(promo: PromoCodeRecord, planId: PremiumPlanId): PromoQuote {
  const baseAmountCents = getPlanAmountCents(planId)
  const label = promo.label?.trim() || `Code ${promo.code}`

  if (promo.kind === "trial") {
    const trialDays = promo.trial_days ?? 7

    return {
      amountDueNowCents: 0,
      baseAmountCents,
      code: promo.code,
      currency: "EUR",
      discountAmountCents: 0,
      expiresAt: promo.expires_at,
      kind: promo.kind,
      label,
      message: `Code appliqué : ${trialDays} jours d'essai gratuit, puis ${formatEuroFromCents(baseAmountCents)} selon l'offre choisie.`,
      planId,
      trialDays,
    }
  }

  const rawDiscount =
    promo.kind === "percent"
      ? Math.round((baseAmountCents * Math.max(promo.discount_value ?? 0, 0)) / 100)
      : Math.max(promo.discount_value ?? 0, 0)
  const discountAmountCents = Math.min(rawDiscount, baseAmountCents)
  const amountDueNowCents = Math.max(baseAmountCents - discountAmountCents, 0)

  return {
    amountDueNowCents,
    baseAmountCents,
    code: promo.code,
    currency: "EUR",
    discountAmountCents,
    expiresAt: promo.expires_at,
    kind: promo.kind,
    label,
    message: `Code appliqué : ${formatEuroFromCents(discountAmountCents)} de réduction. Total aujourd'hui : ${formatEuroFromCents(amountDueNowCents)}.`,
    planId,
    trialDays: null,
  }
}

function isPlanEligible(promo: PromoCodeRecord, planId: PremiumPlanId) {
  return !promo.applies_to_plans?.length || promo.applies_to_plans.includes(planId)
}

async function expireOldPendingRedemptions() {
  const supabase = getSupabaseAdminClient()
  const expiresBefore = new Date(Date.now() - PENDING_REDEMPTION_TTL_MINUTES * 60 * 1000).toISOString()
  const { error } = await supabase
    .from("promo_code_redemptions")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("created_at", expiresBefore)

  if (error) {
    throw new Error(`Unable to expire pending promo redemptions: ${error.message}`)
  }
}

async function getPromoRedemptionCounts(promoId: string, redeemerHash: string): Promise<PromoRedemptionCounts> {
  const supabase = getSupabaseAdminClient()
  const [totalResult, identityResult] = await Promise.all([
    supabase
      .from("promo_code_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("promo_code_id", promoId)
      .in("status", ["pending", "completed"]),
    supabase
      .from("promo_code_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("promo_code_id", promoId)
      .eq("redeemer_hash", redeemerHash)
      .in("status", ["pending", "completed"]),
  ])

  if (totalResult.error) {
    throw new Error(`Unable to count promo redemptions: ${totalResult.error.message}`)
  }

  if (identityResult.error) {
    throw new Error(`Unable to count promo redemptions by identity: ${identityResult.error.message}`)
  }

  return {
    identityCount: identityResult.count ?? 0,
    totalCount: totalResult.count ?? 0,
  }
}

function validatePromoRecord(input: {
  counts: PromoRedemptionCounts
  planId: PremiumPlanId
  promo: PromoCodeRecord
}): PromoValidationPayload {
  const { counts, planId, promo } = input
  const now = Date.now()

  if (!promo.active) {
    return buildPayload("inactive")
  }

  if (promo.starts_at && new Date(promo.starts_at).getTime() > now) {
    return buildPayload("not_started")
  }

  if (promo.expires_at && new Date(promo.expires_at).getTime() <= now) {
    return buildPayload("expired")
  }

  if (!isPlanEligible(promo, planId) || (promo.kind === "trial" && planId === "day-pass")) {
    return buildPayload("incompatible_plan")
  }

  if (promo.max_redemptions !== null && counts.totalCount >= promo.max_redemptions) {
    return buildPayload("exhausted")
  }

  if (
    promo.max_redemptions_per_identity !== null &&
    counts.identityCount >= promo.max_redemptions_per_identity
  ) {
    return buildPayload("already_used")
  }

  return buildPayload("valid", buildPromoQuote(promo, planId))
}

export async function validatePromoCodeForPlan(input: {
  anonymousId: string
  code: string
  planId: PremiumPlanId
  userId?: string | null
}) {
  if (!isPromoStoreConfigured()) {
    return {
      payload: buildPayload("not_configured"),
      promo: null,
    }
  }

  const code = normalizePromoCode(input.code)

  if (!code) {
    return {
      payload: buildPayload("invalid"),
      promo: null,
    }
  }

  try {
    await expireOldPendingRedemptions()
  } catch (error) {
    if (isMissingPromoStorageError(error as { code?: string; message?: string })) {
      return {
        payload: buildPayload("not_configured"),
        promo: null,
      }
    }

    throw error
  }

  const supabase = getSupabaseAdminClient()
  const { data: promo, error } = await supabase
    .from("promo_codes")
    .select(
      "id, code, label, kind, discount_value, trial_days, currency, active, starts_at, expires_at, max_redemptions, max_redemptions_per_identity, applies_to_plans, stripe_coupon_id",
    )
    .eq("code", code)
    .maybeSingle<PromoCodeRecord>()

  if (error) {
    if (isMissingPromoStorageError(error)) {
      return {
        payload: buildPayload("not_configured"),
        promo: null,
      }
    }

    throw new Error(`Unable to load promo code: ${error.message}`)
  }

  if (!promo) {
    return {
      payload: buildPayload("invalid"),
      promo: null,
    }
  }

  const counts = await getPromoRedemptionCounts(
    promo.id,
    buildPromoRedeemerHash({
      anonymousId: input.anonymousId,
      userId: input.userId,
    }),
  )

  return {
    payload: validatePromoRecord({ counts, planId: input.planId, promo }),
    promo,
  }
}

export async function reservePromoCodeForCheckout(input: {
  anonymousId: string
  code: string
  planId: PremiumPlanId
  trialDays?: number | null
  userId?: string | null
}): Promise<PromoReservation | PromoValidationPayload> {
  const validation = await validatePromoCodeForPlan(input)

  if (!validation.payload.valid || !validation.promo || !validation.payload.quote) {
    return validation.payload
  }

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.rpc("reserve_promo_code", {
    p_amount_discount_cents: validation.payload.quote.discountAmountCents,
    p_anonymous_id: input.anonymousId,
    p_code: normalizePromoCode(input.code),
    p_plan_id: input.planId,
    p_redeemer_hash: buildPromoRedeemerHash({
      anonymousId: input.anonymousId,
      userId: input.userId,
    }),
    p_trial_days: validation.payload.quote.trialDays ?? null,
    p_user_id: input.userId ?? null,
  })

  if (error) {
    throw new Error(`Unable to reserve promo code: ${error.message}`)
  }

  const row = (Array.isArray(data) ? data[0] : data) as PromoReservationRow | null

  if (!row || row.status !== "valid" || !row.redemption_id) {
    return buildPayload(row?.status ?? "invalid")
  }

  return {
    promo: validation.promo,
    quote: validation.payload.quote,
    redemptionId: row.redemption_id,
  }
}

export async function attachPromoRedemptionToCheckout(input: {
  redemptionId: string
  stripeCheckoutSessionId: string
  stripeCustomerId?: string | null
}) {
  if (!isPromoStoreConfigured()) {
    return
  }

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from("promo_code_redemptions")
    .update({
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_customer_id: input.stripeCustomerId ?? null,
    })
    .eq("id", input.redemptionId)

  if (error) {
    throw new Error(`Unable to attach promo redemption to Checkout: ${error.message}`)
  }
}

export async function markPromoRedemptionCompleted(input: {
  redemptionId?: string | null
  stripeCheckoutSessionId?: string | null
}) {
  if (!isPromoStoreConfigured() || (!input.redemptionId && !input.stripeCheckoutSessionId)) {
    return
  }

  const supabase = getSupabaseAdminClient()
  const query = supabase
    .from("promo_code_redemptions")
    .update({
      completed_at: new Date().toISOString(),
      status: "completed",
    })

  const { error } = input.redemptionId
    ? await query.eq("id", input.redemptionId)
    : await query.eq("stripe_checkout_session_id", input.stripeCheckoutSessionId!)

  if (error) {
    throw new Error(`Unable to complete promo redemption: ${error.message}`)
  }
}

export async function voidPromoRedemption(redemptionId?: string | null) {
  if (!isPromoStoreConfigured() || !redemptionId) {
    return
  }

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from("promo_code_redemptions")
    .update({ status: "void" })
    .eq("id", redemptionId)
    .eq("status", "pending")

  if (error) {
    throw new Error(`Unable to void promo redemption: ${error.message}`)
  }
}

function buildStripeCouponId(promo: PromoCodeRecord) {
  return `label2a4_${promo.id.replace(/-/g, "").slice(0, 24)}`
}

export async function getOrCreateStripeCouponForPromo(stripe: Stripe, promo: PromoCodeRecord) {
  if (promo.kind === "trial") {
    return null
  }

  if (promo.stripe_coupon_id) {
    return promo.stripe_coupon_id
  }

  const couponId = buildStripeCouponId(promo)

  try {
    const existingCoupon = await stripe.coupons.retrieve(couponId)

    if (!existingCoupon.deleted) {
      return existingCoupon.id
    }
  } catch (error) {
    const stripeError = error as { statusCode?: number }

    if (stripeError.statusCode !== 404) {
      throw error
    }
  }

  const couponParams: Stripe.CouponCreateParams = {
    duration: "once",
    id: couponId,
    metadata: {
      label2a4_promo_code: promo.code,
      label2a4_promo_id: promo.id,
    },
    name: promo.label ?? `Label2A4 ${promo.code}`,
  }

  if (promo.kind === "percent") {
    couponParams.percent_off = Math.max(promo.discount_value ?? 0, 0)
  } else {
    couponParams.amount_off = Math.max(promo.discount_value ?? 0, 1)
    couponParams.currency = promo.currency.toLowerCase()
  }

  const createdCoupon = await stripe.coupons.create(couponParams)
  return createdCoupon.id
}
