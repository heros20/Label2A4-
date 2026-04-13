import "server-only"
import { formatEuroFromCents } from "@/lib/site-config"
import { getStripe, isStripeConfigured } from "@/lib/stripe"

type AdminSubscriptionPlan = "monthly" | "annual" | "other"

interface AdminRecentPayment {
  amountLabel: string
  createdAt: string
  customer: string
  id: string
  refunded: boolean
  status: string
}

interface AdminRecentSubscription {
  createdAt: string
  customer: string
  id: string
  plan: AdminSubscriptionPlan
  periodEnd: string | null
  status: string
}

export interface AdminDashboardData {
  checkoutCompleted30d: number
  checkoutStarted30d: number
  checkoutConversionRate30d: number
  customEvents: string[]
  grossRevenue30dLabel: string
  monthlySubscriptions: number
  annualSubscriptions: number
  mrrEquivalentLabel: string
  payments30d: number
  recentPayments: AdminRecentPayment[]
  recentSubscriptions: AdminRecentSubscription[]
  refundedAmount30dLabel: string
  refundedPayments30d: number
  stripeConfigured: boolean
  stripePortalConfigured: boolean
  subscriptionsActive: number
  subscriptionsPastDue: number
  subscriptionsTrialing: number
}

function formatDate(value: number) {
  return new Date(value * 1000).toLocaleString("fr-FR")
}

function getSubscriptionPlan(
  subscription: Awaited<ReturnType<ReturnType<typeof getStripe>["subscriptions"]["list"]>>["data"][number],
) {
  const priceId = subscription.items.data[0]?.price?.id

  if (priceId && priceId === process.env.STRIPE_PRICE_MONTHLY) {
    return "monthly"
  }

  if (priceId && priceId === process.env.STRIPE_PRICE_ANNUAL) {
    return "annual"
  }

  return "other"
}

function getSubscriptionPeriodEnd(
  subscription: Awaited<ReturnType<ReturnType<typeof getStripe>["subscriptions"]["list"]>>["data"][number],
) {
  const currentPeriodEnd = subscription.items.data.reduce((latest, item) => {
    return typeof item.current_period_end === "number" ? Math.max(latest, item.current_period_end) : latest
  }, 0)

  return currentPeriodEnd > 0 ? formatDate(currentPeriodEnd) : null
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const defaultData: AdminDashboardData = {
    checkoutCompleted30d: 0,
    checkoutStarted30d: 0,
    checkoutConversionRate30d: 0,
    customEvents: [
      "pricing_viewed",
      "account_viewed",
      "pricing_cta_clicked",
      "account_upgrade_clicked",
      "checkout_session_created",
      "checkout_redirected",
      "checkout_completed",
      "checkout_cancelled_page_view",
      "payment_success_page_view",
      "billing_portal_clicked",
      "billing_portal_session_created",
      "billing_portal_redirected",
      "home_pricing_link_clicked",
      "export_validated",
      "quota_exceeded",
    ],
    grossRevenue30dLabel: formatEuroFromCents(0),
    monthlySubscriptions: 0,
    annualSubscriptions: 0,
    mrrEquivalentLabel: formatEuroFromCents(0),
    payments30d: 0,
    recentPayments: [],
    recentSubscriptions: [],
    refundedAmount30dLabel: formatEuroFromCents(0),
    refundedPayments30d: 0,
    stripeConfigured: false,
    stripePortalConfigured: Boolean(process.env.STRIPE_BILLING_PORTAL_CONFIGURATION),
    subscriptionsActive: 0,
    subscriptionsPastDue: 0,
    subscriptionsTrialing: 0,
  }

  if (!isStripeConfigured()) {
    return defaultData
  }

  const stripe = getStripe()
  const sinceThirtyDays = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)

  const [subscriptions, charges, sessions] = await Promise.all([
    stripe.subscriptions.list({
      status: "all",
      limit: 100,
      expand: ["data.customer"],
    }),
    stripe.charges.list({
      limit: 100,
      created: {
        gte: sinceThirtyDays,
      },
    }),
    stripe.checkout.sessions.list({
      limit: 100,
    }),
  ])

  const activeStatuses = new Set(["active", "trialing", "past_due"])
  const activeSubscriptions = subscriptions.data.filter((subscription) =>
    activeStatuses.has(subscription.status),
  )

  const monthlySubscriptions = activeSubscriptions.filter(
    (subscription) => getSubscriptionPlan(subscription) === "monthly",
  )
  const annualSubscriptions = activeSubscriptions.filter(
    (subscription) => getSubscriptionPlan(subscription) === "annual",
  )

  const mrrEquivalentCents = activeSubscriptions.reduce((sum, subscription) => {
    const price = subscription.items.data[0]?.price
    const unitAmount = price?.unit_amount ?? 0
    const plan = getSubscriptionPlan(subscription)

    if (plan === "annual") {
      return sum + Math.round(unitAmount / 12)
    }

    return sum + unitAmount
  }, 0)

  const paidCharges = charges.data.filter((charge) => charge.paid)
  const grossRevenue30dCents = paidCharges.reduce((sum, charge) => sum + charge.amount, 0)
  const refundedAmount30dCents = charges.data.reduce((sum, charge) => sum + charge.amount_refunded, 0)
  const refundedPayments30d = charges.data.filter((charge) => charge.amount_refunded > 0).length

  const checkoutSessions30d = sessions.data.filter((session) => session.created >= sinceThirtyDays)
  const completedCheckoutSessions30d = checkoutSessions30d.filter((session) => session.status === "complete")

  return {
    checkoutCompleted30d: completedCheckoutSessions30d.length,
    checkoutStarted30d: checkoutSessions30d.length,
    checkoutConversionRate30d:
      checkoutSessions30d.length > 0
        ? Math.round((completedCheckoutSessions30d.length / checkoutSessions30d.length) * 100)
        : 0,
    customEvents: defaultData.customEvents,
    grossRevenue30dLabel: formatEuroFromCents(grossRevenue30dCents),
    monthlySubscriptions: monthlySubscriptions.length,
    annualSubscriptions: annualSubscriptions.length,
    mrrEquivalentLabel: formatEuroFromCents(mrrEquivalentCents),
    payments30d: paidCharges.length,
    recentPayments: paidCharges.slice(0, 10).map((charge) => ({
      amountLabel: formatEuroFromCents(charge.amount),
      createdAt: formatDate(charge.created),
      customer:
        charge.billing_details.email ??
        charge.billing_details.name ??
        charge.customer?.toString() ??
        "Client inconnu",
      id: charge.id,
      refunded: charge.amount_refunded > 0,
      status: charge.status ?? (charge.paid ? "paid" : "unknown"),
    })),
    recentSubscriptions: subscriptions.data.slice(0, 10).map((subscription) => {
      const customer =
        typeof subscription.customer === "object" &&
        subscription.customer &&
        !("deleted" in subscription.customer && subscription.customer.deleted)
          ? subscription.customer.email ?? subscription.customer.name ?? subscription.customer.id
          : subscription.customer?.toString() ?? "Client inconnu"

      return {
        createdAt: formatDate(subscription.created),
        customer,
        id: subscription.id,
        plan: getSubscriptionPlan(subscription),
        periodEnd: getSubscriptionPeriodEnd(subscription),
        status: subscription.status,
      }
    }),
    refundedAmount30dLabel: formatEuroFromCents(refundedAmount30dCents),
    refundedPayments30d,
    stripeConfigured: true,
    stripePortalConfigured: Boolean(process.env.STRIPE_BILLING_PORTAL_CONFIGURATION),
    subscriptionsActive: activeSubscriptions.filter((subscription) => subscription.status === "active").length,
    subscriptionsPastDue: activeSubscriptions.filter((subscription) => subscription.status === "past_due").length,
    subscriptionsTrialing: activeSubscriptions.filter((subscription) => subscription.status === "trialing").length,
  }
}
