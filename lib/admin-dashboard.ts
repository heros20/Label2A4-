import "server-only"
import { formatEuroFromCents } from "@/lib/site-config"
import { getStripe, isStripeConfigured } from "@/lib/stripe"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { isSupabaseAdminConfigured } from "@/lib/supabase/config"

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

export interface AdminOperationalRow {
  category: string
  detail: string
  metric: string
  status: "ok" | "warning" | "muted"
  value: string
}

export interface AdminPromoCode {
  active: boolean
  code: string
  discountLabel: string
  expiresAt: string | null
  label: string
  limitsLabel: string
  plansLabel: string
  utility: string
}

export interface AdminDashboardData {
  checkoutCompleted30d: number
  checkoutStarted30d: number
  checkoutConversionRate30d: number
  customEvents: string[]
  grossRevenue30dLabel: string
  operationalRows: AdminOperationalRow[]
  operationalRowsConfigured: boolean
  monthlySubscriptions: number
  annualSubscriptions: number
  mrrEquivalentLabel: string
  payments30d: number
  promoCodes: AdminPromoCode[]
  promoCodesConfigured: boolean
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

interface PromoCodeRow {
  active: boolean
  applies_to_plans: string[] | null
  code: string
  discount_value: number | null
  expires_at: string | null
  kind: "fixed" | "percent" | "trial"
  label: string | null
  max_redemptions: number | null
  max_redemptions_per_identity: number | null
  trial_days: number | null
}

interface ImpactCounterRow {
  labels_optimized: number
  optimized_sheets: number
  sheets_saved: number
}

interface DailyQuotaUsageRow {
  used_sheets: number
}

interface PromoRedemptionRow {
  status: "pending" | "completed" | "expired" | "void"
}

function formatDate(value: number) {
  return new Date(value * 1000).toLocaleString("fr-FR")
}

function formatIsoDate(value: string | null) {
  return value ? new Date(value).toLocaleString("fr-FR") : null
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value)
}

function getFallbackPromoCodes(): AdminPromoCode[] {
  return [
    {
      active: false,
      code: "WELCOME20",
      discountLabel: "-20%",
      expiresAt: null,
      label: "Bienvenue -20%",
      limitsLabel: "1 utilisation par compte ou invite",
      plansLabel: "Mensuel, annuel, pass 24h",
      utility: "Code d'accueil ou influenceur pour déclencher un premier achat.",
    },
    {
      active: false,
      code: "TRIAL7",
      discountLabel: "7 jours gratuits",
      expiresAt: null,
      label: "Essai gratuit 7 jours",
      limitsLabel: "1 utilisation par compte ou invite",
      plansLabel: "Mensuel, annuel",
      utility: "Essai gratuit sécurisé pour convertir les utilisateurs réguliers vers un abonnement.",
    },
  ]
}

function getPromoDiscountLabel(promo: PromoCodeRow) {
  if (promo.kind === "trial") {
    return `${promo.trial_days ?? 7} jours gratuits`
  }

  if (promo.kind === "percent") {
    return `-${promo.discount_value ?? 0}%`
  }

  return `-${formatEuroFromCents(promo.discount_value ?? 0)}`
}

function getPromoUtility(promo: PromoCodeRow) {
  if (promo.kind === "trial") {
    return "Essai gratuit pour lever la friction avant abonnement."
  }

  if (promo.kind === "percent") {
    return "Réduction en pourcentage adaptée aux influenceurs et campagnes larges."
  }

  return "Réduction fixe utile pour offres ponctuelles ou compensations support."
}

async function getAdminPromoCodes() {
  if (!isSupabaseAdminConfigured()) {
    return {
      configured: false,
      promoCodes: getFallbackPromoCodes(),
    }
  }

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("promo_codes")
    .select(
      "code, label, kind, discount_value, trial_days, active, expires_at, max_redemptions, max_redemptions_per_identity, applies_to_plans",
    )
    .order("created_at", { ascending: false })
    .returns<PromoCodeRow[]>()

  if (error) {
    const tableMissing =
      error.code === "PGRST205" || error.message.includes("Could not find the table 'public.promo_codes'")

    if (tableMissing) {
      return {
        configured: false,
        promoCodes: getFallbackPromoCodes(),
      }
    }

    throw new Error(`Unable to load promo codes for admin dashboard: ${error.message}`)
  }

  return {
    configured: true,
    promoCodes: (data ?? []).map((promo) => ({
      active: promo.active,
      code: promo.code,
      discountLabel: getPromoDiscountLabel(promo),
      expiresAt: formatIsoDate(promo.expires_at),
      label: promo.label ?? promo.code,
      limitsLabel: [
        promo.max_redemptions ? `${promo.max_redemptions} utilisations max` : "Sans limite globale",
        promo.max_redemptions_per_identity
          ? `${promo.max_redemptions_per_identity} par compte/invite`
          : "Sans limite par identité",
      ].join(" · "),
      plansLabel: promo.applies_to_plans?.length ? promo.applies_to_plans.join(", ") : "Tous les plans",
      utility: getPromoUtility(promo),
    })),
  }
}

function isMissingOperationalStorageError(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST205" ||
    Boolean(error?.message?.includes("Could not find the table 'public.label_impact_counters'")) ||
    Boolean(error?.message?.includes("Could not find the table 'public.daily_quota_usage'")) ||
    Boolean(error?.message?.includes("Could not find the table 'public.rate_limit_usage'")) ||
    Boolean(error?.message?.includes("Could not find the table 'public.promo_code_redemptions'"))
  )
}

function getFallbackOperationalRows(detail: string): AdminOperationalRow[] {
  return [
    {
      category: "Configuration",
      detail,
      metric: "Supabase",
      status: "warning",
      value: "Non disponible",
    },
  ]
}

async function getAdminOperationalRows() {
  if (!isSupabaseAdminConfigured()) {
    return {
      configured: false,
      rows: getFallbackOperationalRows("Ajoutez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY pour lire ces indicateurs."),
    }
  }

  const supabase = getSupabaseAdminClient()
  const todayKey = new Date().toISOString().slice(0, 10)

  const [impactResult, quotaResult, promoRedemptionsResult, rateLimitResult] = await Promise.all([
    supabase
      .from("label_impact_counters")
      .select("labels_optimized, optimized_sheets, sheets_saved")
      .eq("scope_type", "platform")
      .eq("scope_hash", "global")
      .maybeSingle<ImpactCounterRow>(),
    supabase
      .from("daily_quota_usage")
      .select("used_sheets")
      .eq("day_key", todayKey)
      .returns<DailyQuotaUsageRow[]>(),
    supabase.from("promo_code_redemptions").select("status").returns<PromoRedemptionRow[]>(),
    supabase.from("rate_limit_usage").select("bucket_hash", { count: "exact", head: true }),
  ])

  const possibleErrors = [
    impactResult.error,
    quotaResult.error,
    promoRedemptionsResult.error,
    rateLimitResult.error,
  ]
  const missingStorage = possibleErrors.some(isMissingOperationalStorageError)

  if (missingStorage) {
    return {
      configured: false,
      rows: getFallbackOperationalRows(
        "Appliquez les fichiers SQL Supabase du projet pour activer impact, quota, promos et rate limiting.",
      ),
    }
  }

  const blockingError = possibleErrors.find(Boolean)
  if (blockingError) {
    throw new Error(`Unable to load operational admin rows: ${blockingError.message}`)
  }

  const impact = impactResult.data
  const quotaRows = quotaResult.data ?? []
  const promoRedemptionRows = promoRedemptionsResult.data ?? []
  const promoCounts = promoRedemptionRows.reduce(
    (counts, redemption) => {
      counts[redemption.status] += 1
      return counts
    },
    {
      completed: 0,
      expired: 0,
      pending: 0,
      void: 0,
    },
  )
  const quotaSheetsToday = quotaRows.reduce((sum, row) => sum + row.used_sheets, 0)

  return {
    configured: true,
    rows: [
      {
        category: "Impact",
        detail: `${formatInteger(impact?.labels_optimized ?? 0)} etiquettes optimisees, ${formatInteger(
          impact?.optimized_sheets ?? 0,
        )} feuilles A4 generees.`,
        metric: "Feuilles economisees",
        status: "ok",
        value: formatInteger(impact?.sheets_saved ?? 0),
      },
      {
        category: "Quota",
        detail: `${formatInteger(quotaRows.length)} identites suivies aujourd'hui en UTC.`,
        metric: "Feuilles consommees aujourd'hui",
        status: quotaSheetsToday > 0 ? "ok" : "muted",
        value: formatInteger(quotaSheetsToday),
      },
      {
        category: "Promos",
        detail: `${formatInteger(promoCounts.pending)} en attente, ${formatInteger(
          promoCounts.expired,
        )} expirees, ${formatInteger(promoCounts.void)} annulees.`,
        metric: "Redemptions completes",
        status: promoCounts.completed > 0 ? "ok" : "muted",
        value: formatInteger(promoCounts.completed),
      },
      {
        category: "Anti-abus",
        detail: "Buckets rate limit encore conserves avant purge planifiee.",
        metric: "Buckets rate limit",
        status: (rateLimitResult.count ?? 0) > 0 ? "ok" : "muted",
        value: formatInteger(rateLimitResult.count ?? 0),
      },
    ] satisfies AdminOperationalRow[],
  }
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
  const promoSummary = await getAdminPromoCodes()
  const operationalSummary = await getAdminOperationalRows()
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
    operationalRows: operationalSummary.rows,
    operationalRowsConfigured: operationalSummary.configured,
    monthlySubscriptions: 0,
    annualSubscriptions: 0,
    mrrEquivalentLabel: formatEuroFromCents(0),
    payments30d: 0,
    promoCodes: promoSummary.promoCodes,
    promoCodesConfigured: promoSummary.configured,
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
    operationalRows: operationalSummary.rows,
    operationalRowsConfigured: operationalSummary.configured,
    monthlySubscriptions: monthlySubscriptions.length,
    annualSubscriptions: annualSubscriptions.length,
    mrrEquivalentLabel: formatEuroFromCents(mrrEquivalentCents),
    payments30d: paidCharges.length,
    promoCodes: promoSummary.promoCodes,
    promoCodesConfigured: promoSummary.configured,
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
