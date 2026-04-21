import { NextRequest, NextResponse } from "next/server"
import { isAdminDashboardConfigured, isAdminRequestAuthenticated } from "@/lib/admin-auth"
import type { PromoKind } from "@/lib/promo-types"
import { normalizePromoCode } from "@/lib/promo-codes"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { isSupabaseAdminConfigured } from "@/lib/supabase/config"

export const runtime = "nodejs"

const planIds = ["monthly", "annual", "day-pass"] as const
type PromoPlanId = (typeof planIds)[number]

interface CreatePromoPayload {
  active?: boolean
  appliesToPlans?: unknown
  code?: unknown
  discountValue?: unknown
  expiresAt?: unknown
  kind?: unknown
  label?: unknown
  maxRedemptions?: unknown
  maxRedemptionsPerIdentity?: unknown
  notes?: unknown
  startsAt?: unknown
  trialDays?: unknown
}

interface TogglePromoPayload {
  active?: unknown
  code?: unknown
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function isMissingPromoStorageError(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST205" ||
    Boolean(error?.message?.includes("Could not find the table 'public.promo_codes'"))
  )
}

function parseString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maxLength) : null
}

function parsePositiveInteger(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function parseNullableDate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  if (typeof value !== "string") {
    throw new Error("Date invalide.")
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Date invalide.")
  }

  return parsed.toISOString()
}

function parsePromoPlans(value: unknown): PromoPlanId[] {
  if (!Array.isArray(value)) {
    return [...planIds]
  }

  const uniquePlans = Array.from(new Set(value)).filter((plan): plan is PromoPlanId =>
    planIds.includes(plan as PromoPlanId),
  )

  if (uniquePlans.length === 0) {
    throw new Error("Selectionnez au moins une offre compatible.")
  }

  return uniquePlans
}

function parseKind(value: unknown): PromoKind | null {
  return value === "percent" || value === "fixed" || value === "trial" ? value : null
}

function ensureAdminAccess(request: NextRequest) {
  if (!isAdminDashboardConfigured()) {
    return jsonError("ADMIN_DASHBOARD_TOKEN manquant.", 503)
  }

  if (!isAdminRequestAuthenticated(request)) {
    return jsonError("Session admin invalide.", 401)
  }

  if (!isSupabaseAdminConfigured()) {
    return jsonError("Supabase service role n'est pas configure pour gerer les codes promo.", 503)
  }

  return null
}

function validatePromoPayload(payload: CreatePromoPayload) {
  const code = normalizePromoCode(typeof payload.code === "string" ? payload.code : "")
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
    throw new Error("Le code doit contenir 3 a 32 caracteres A-Z, 0-9, tiret ou underscore.")
  }

  const kind = parseKind(payload.kind)
  if (!kind) {
    throw new Error("Type de code promo invalide.")
  }

  const appliesToPlans = parsePromoPlans(payload.appliesToPlans)
  if (kind === "trial" && appliesToPlans.includes("day-pass") && appliesToPlans.length === 1) {
    throw new Error("Un essai gratuit ne peut pas s'appliquer uniquement au pass 24h.")
  }

  const discountValue = parsePositiveInteger(payload.discountValue)
  const trialDays = parsePositiveInteger(payload.trialDays)

  if (kind === "percent" && (!discountValue || discountValue > 100)) {
    throw new Error("Une reduction en pourcentage doit etre comprise entre 1 et 100.")
  }

  if (kind === "fixed" && !discountValue) {
    throw new Error("Une reduction fixe doit avoir un montant en centimes superieur a 0.")
  }

  if (kind === "trial" && !trialDays) {
    throw new Error("Un essai gratuit doit avoir une duree en jours superieure a 0.")
  }

  const startsAt = parseNullableDate(payload.startsAt)
  const expiresAt = parseNullableDate(payload.expiresAt)

  if (startsAt && expiresAt && new Date(startsAt).getTime() >= new Date(expiresAt).getTime()) {
    throw new Error("La date de debut doit etre anterieure a la date d'expiration.")
  }

  return {
    active: payload.active !== false,
    applies_to_plans: kind === "trial" ? appliesToPlans.filter((plan) => plan !== "day-pass") : appliesToPlans,
    code,
    currency: "eur",
    discount_value: kind === "trial" ? null : discountValue,
    expires_at: expiresAt,
    kind,
    label: parseString(payload.label, 120),
    max_redemptions: parsePositiveInteger(payload.maxRedemptions),
    max_redemptions_per_identity: parsePositiveInteger(payload.maxRedemptionsPerIdentity),
    notes: parseString(payload.notes, 500),
    starts_at: startsAt,
    trial_days: kind === "trial" ? trialDays : null,
  }
}

export async function POST(request: NextRequest) {
  const accessError = ensureAdminAccess(request)
  if (accessError) {
    return accessError
  }

  try {
    const payload = (await request.json()) as CreatePromoPayload
    const promoRecord = validatePromoPayload(payload)
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from("promo_codes")
      .insert(promoRecord)
      .select("code, active")
      .single<{ code: string; active: boolean }>()

    if (error) {
      if (isMissingPromoStorageError(error)) {
        return jsonError("Table promo_codes absente. Appliquez supabase/promo_codes.sql une seule fois.", 503)
      }

      if (error.code === "23505") {
        return jsonError("Ce code promo existe deja.", 409)
      }

      throw new Error(error.message)
    }

    console.info("[label2a4-admin-promo-created]", { code: data.code, active: data.active })
    return NextResponse.json({ ok: true, promo: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de creer le code promo."
    console.error("[label2a4-admin-promo-create]", error)
    return jsonError(message, 400)
  }
}

export async function PATCH(request: NextRequest) {
  const accessError = ensureAdminAccess(request)
  if (accessError) {
    return accessError
  }

  try {
    const payload = (await request.json()) as TogglePromoPayload
    const code = normalizePromoCode(typeof payload.code === "string" ? payload.code : "")

    if (!code) {
      return jsonError("Code promo manquant.", 400)
    }

    if (typeof payload.active !== "boolean") {
      return jsonError("Etat actif/inactif invalide.", 400)
    }

    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from("promo_codes")
      .update({
        active: payload.active,
        updated_at: new Date().toISOString(),
      })
      .eq("code", code)
      .select("code, active")
      .maybeSingle<{ code: string; active: boolean }>()

    if (error) {
      if (isMissingPromoStorageError(error)) {
        return jsonError("Table promo_codes absente. Appliquez supabase/promo_codes.sql une seule fois.", 503)
      }

      throw new Error(error.message)
    }

    if (!data) {
      return jsonError("Code promo introuvable.", 404)
    }

    console.info("[label2a4-admin-promo-toggled]", { code: data.code, active: data.active })
    return NextResponse.json({ ok: true, promo: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de modifier le code promo."
    console.error("[label2a4-admin-promo-toggle]", error)
    return jsonError(message, 400)
  }
}
