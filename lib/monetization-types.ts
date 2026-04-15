export type PremiumPlanId = "monthly" | "annual" | "day-pass"

export type ActivePlan = "free" | PremiumPlanId

export interface AccessSnapshot {
  anonymousId: string
  userId?: string | null
  userEmail?: string | null
  isAuthenticated: boolean
  plan: ActivePlan
  isPremium: boolean
  dayKey: string
  dailyLimit: number
  usedSheetsToday: number
  remainingSheetsToday: number
  paymentsAvailable: boolean
  billingPortalAvailable: boolean
  expiresAt?: string | null
  subscriptionStatus?: string | null
}
