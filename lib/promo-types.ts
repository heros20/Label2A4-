import type { PremiumPlanId } from "@/lib/monetization-types"

export type PromoKind = "fixed" | "percent" | "trial"

export type PromoValidationStatus =
  | "already_used"
  | "expired"
  | "exhausted"
  | "inactive"
  | "incompatible_plan"
  | "invalid"
  | "not_configured"
  | "not_started"
  | "valid"

export interface PromoQuote {
  amountDueNowCents: number
  baseAmountCents: number
  code: string
  currency: "EUR"
  discountAmountCents: number
  expiresAt?: string | null
  kind: PromoKind
  label: string
  message: string
  planId: PremiumPlanId
  trialDays?: number | null
}

export interface PromoValidationPayload {
  message: string
  quote?: PromoQuote
  status: PromoValidationStatus
  valid: boolean
}

