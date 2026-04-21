export type PremiumPlanId = "monthly" | "annual" | "day-pass"

export type ActivePlan = "free" | PremiumPlanId

export type QuotaKind = "guest" | "free-account" | "premium"

export interface ImpactCounter {
  estimatedTreesSaved: number
  labelsOptimized: number
  optimizedSheets: number
  sheetsSaved: number
}

export interface ImpactSnapshot {
  individual: ImpactCounter
  platform: ImpactCounter
}

export interface AccessSnapshot {
  anonymousId: string
  userId?: string | null
  userEmail?: string | null
  isAuthenticated: boolean
  plan: ActivePlan
  isPremium: boolean
  quotaKind: QuotaKind
  dayKey: string
  dailyLimit: number
  usedSheetsToday: number
  remainingSheetsToday: number
  paymentsAvailable: boolean
  billingPortalAvailable: boolean
  expiresAt?: string | null
  subscriptionStatus?: string | null
}
