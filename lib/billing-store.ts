import "server-only"
import type { ActivePlan, PremiumPlanId } from "@/lib/monetization-types"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { isSupabaseAdminConfigured } from "@/lib/supabase/config"

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"])

export interface StoredPlanState {
  plan: ActivePlan
  isPremium: boolean
  expiresAt?: string | null
  subscriptionStatus?: string | null
  customerId?: string
  subscriptionId?: string
  email?: string
}

interface BillingCustomerRow {
  user_id: string
  stripe_customer_id: string
  email: string | null
}

interface BillingSubscriptionRow {
  stripe_subscription_id: string
  user_id: string
  stripe_customer_id: string
  plan_id: Extract<PremiumPlanId, "monthly" | "annual">
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  cancel_at: string | null
  canceled_at: string | null
  updated_at: string
}

interface DayPassEntitlementRow {
  user_id: string
  stripe_checkout_session_id: string
  stripe_payment_intent_id: string | null
  stripe_customer_id: string | null
  email: string | null
  expires_at: string
  updated_at: string
}

function getNowIso() {
  return new Date().toISOString()
}

export function isBillingStoreConfigured() {
  return isSupabaseAdminConfigured()
}

export async function getBillingCustomerByUserId(userId: string) {
  if (!isBillingStoreConfigured()) {
    return null
  }

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("billing_customers")
    .select("user_id, stripe_customer_id, email")
    .eq("user_id", userId)
    .maybeSingle<BillingCustomerRow>()

  if (error) {
    throw new Error(`Unable to load billing customer by user: ${error.message}`)
  }

  return data
}

export async function getBillingCustomerByStripeCustomerId(stripeCustomerId: string) {
  if (!isBillingStoreConfigured()) {
    return null
  }

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("billing_customers")
    .select("user_id, stripe_customer_id, email")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle<BillingCustomerRow>()

  if (error) {
    throw new Error(`Unable to load billing customer by Stripe customer id: ${error.message}`)
  }

  return data
}

export async function upsertBillingCustomer(input: {
  userId: string
  stripeCustomerId: string
  email?: string | null
}) {
  if (!isBillingStoreConfigured()) {
    return
  }

  const supabase = getSupabaseAdminClient()
  const now = getNowIso()
  const { error } = await supabase.from("billing_customers").upsert(
    {
      user_id: input.userId,
      stripe_customer_id: input.stripeCustomerId,
      email: input.email ?? null,
      updated_at: now,
    },
    { onConflict: "user_id" },
  )

  if (error) {
    throw new Error(`Unable to upsert billing customer: ${error.message}`)
  }
}

export async function upsertBillingSubscription(input: {
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  planId: Extract<PremiumPlanId, "monthly" | "annual">
  status: string
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean
  cancelAt?: string | null
  canceledAt?: string | null
  metadata?: Record<string, string>
}) {
  if (!isBillingStoreConfigured()) {
    return
  }

  const supabase = getSupabaseAdminClient()
  const now = getNowIso()
  const { error } = await supabase.from("billing_subscriptions").upsert(
    {
      stripe_subscription_id: input.stripeSubscriptionId,
      user_id: input.userId,
      stripe_customer_id: input.stripeCustomerId,
      plan_id: input.planId,
      status: input.status,
      current_period_end: input.currentPeriodEnd ?? null,
      cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
      cancel_at: input.cancelAt ?? null,
      canceled_at: input.canceledAt ?? null,
      metadata: input.metadata ?? {},
      updated_at: now,
    },
    { onConflict: "stripe_subscription_id" },
  )

  if (error) {
    throw new Error(`Unable to upsert billing subscription: ${error.message}`)
  }
}

export async function upsertDayPassEntitlement(input: {
  userId: string
  stripeCheckoutSessionId: string
  stripePaymentIntentId?: string | null
  stripeCustomerId?: string | null
  email?: string | null
  expiresAt: string
}) {
  if (!isBillingStoreConfigured()) {
    return
  }

  const supabase = getSupabaseAdminClient()
  const now = getNowIso()
  const { error } = await supabase.from("day_pass_entitlements").upsert(
    {
      user_id: input.userId,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
      stripe_customer_id: input.stripeCustomerId ?? null,
      email: input.email ?? null,
      expires_at: input.expiresAt,
      updated_at: now,
    },
    { onConflict: "stripe_checkout_session_id" },
  )

  if (error) {
    throw new Error(`Unable to upsert day pass entitlement: ${error.message}`)
  }
}

export async function markStripeEventProcessed(input: { eventId: string; eventType: string }) {
  if (!isBillingStoreConfigured()) {
    return true
  }

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("stripe_events").insert({
    event_id: input.eventId,
    event_type: input.eventType,
  })

  if (!error) {
    return true
  }

  if (error.code === "23505") {
    return false
  }

  throw new Error(`Unable to mark Stripe event as processed: ${error.message}`)
}

export async function resolveStoredPlanStateForUser(userId: string): Promise<StoredPlanState> {
  if (!isBillingStoreConfigured()) {
    return {
      plan: "free",
      isPremium: false,
    }
  }

  const supabase = getSupabaseAdminClient()
  const nowIso = getNowIso()

  const [{ data: customer, error: customerError }, { data: subscriptions, error: subscriptionsError }, { data: dayPasses, error: dayPassError }] =
    await Promise.all([
      supabase
        .from("billing_customers")
        .select("user_id, stripe_customer_id, email")
        .eq("user_id", userId)
        .maybeSingle<BillingCustomerRow>(),
      supabase
        .from("billing_subscriptions")
        .select(
          "stripe_subscription_id, user_id, stripe_customer_id, plan_id, status, current_period_end, cancel_at_period_end, cancel_at, canceled_at, updated_at",
        )
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .returns<BillingSubscriptionRow[]>(),
      supabase
        .from("day_pass_entitlements")
        .select(
          "user_id, stripe_checkout_session_id, stripe_payment_intent_id, stripe_customer_id, email, expires_at, updated_at",
        )
        .eq("user_id", userId)
        .gt("expires_at", nowIso)
        .order("expires_at", { ascending: false })
        .returns<DayPassEntitlementRow[]>(),
    ])

  if (customerError) {
    throw new Error(`Unable to load stored billing customer: ${customerError.message}`)
  }

  if (subscriptionsError) {
    throw new Error(`Unable to load stored subscriptions: ${subscriptionsError.message}`)
  }

  if (dayPassError) {
    throw new Error(`Unable to load stored day pass entitlements: ${dayPassError.message}`)
  }

  const activeSubscription = (subscriptions ?? []).find((subscription) => {
    if (!ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
      return false
    }

    if (!subscription.current_period_end) {
      return true
    }

    return new Date(subscription.current_period_end).getTime() > Date.now()
  })

  if (activeSubscription) {
    return {
      plan: activeSubscription.plan_id,
      isPremium: true,
      expiresAt: activeSubscription.current_period_end,
      subscriptionStatus: activeSubscription.status,
      customerId: activeSubscription.stripe_customer_id ?? customer?.stripe_customer_id ?? undefined,
      subscriptionId: activeSubscription.stripe_subscription_id,
      email: customer?.email ?? undefined,
    }
  }

  const activeDayPass = dayPasses?.[0]

  if (activeDayPass) {
    return {
      plan: "day-pass",
      isPremium: true,
      expiresAt: activeDayPass.expires_at,
      customerId: activeDayPass.stripe_customer_id ?? customer?.stripe_customer_id ?? undefined,
      email: activeDayPass.email ?? customer?.email ?? undefined,
    }
  }

  return {
    plan: "free",
    isPremium: false,
    customerId: customer?.stripe_customer_id ?? undefined,
    email: customer?.email ?? undefined,
  }
}
