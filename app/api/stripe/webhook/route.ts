import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"
import {
  getBillingCustomerByStripeCustomerId,
  isBillingStoreConfigured,
  markStripeEventProcessed,
  upsertBillingCustomer,
  upsertBillingSubscription,
  upsertDayPassEntitlement,
} from "@/lib/billing-store"
import { markPromoRedemptionCompleted } from "@/lib/promo-codes"
import { trackServerEvent } from "@/lib/server-analytics"
import { getPlanIdFromStripePriceId, getStripe, getStripeWebhookSecret, isStripeConfigured } from "@/lib/stripe"

export const runtime = "nodejs"

function getStringId(value: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  if (!value) {
    return null
  }

  return typeof value === "string" ? value : value.id
}

function getStringPaymentIntentId(value: string | Stripe.PaymentIntent | null) {
  if (!value) {
    return null
  }

  return typeof value === "string" ? value : value.id
}

function getMetadataUserId(metadata?: Stripe.Metadata | null) {
  const value = metadata?.userId?.trim()
  return value ? value : null
}

function getSubscriptionCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const currentPeriodEnd = subscription.items.data.reduce((latest, item) => {
    return typeof item.current_period_end === "number" ? Math.max(latest, item.current_period_end) : latest
  }, 0)

  return currentPeriodEnd > 0 ? new Date(currentPeriodEnd * 1000).toISOString() : null
}

async function resolveUserId(input: { stripeCustomerId?: string | null; metadataUserId?: string | null }) {
  if (input.metadataUserId) {
    return input.metadataUserId
  }

  if (!input.stripeCustomerId) {
    return null
  }

  const customer = await getBillingCustomerByStripeCustomerId(input.stripeCustomerId)
  return customer?.user_id ?? null
}

async function handleDayPassSession(session: Stripe.Checkout.Session, grantedAt: number) {
  if (session.payment_status !== "paid") {
    return
  }

  const stripeCustomerId = getStringId(session.customer)
  const userId = await resolveUserId({
    stripeCustomerId,
    metadataUserId: getMetadataUserId(session.metadata),
  })

  if (!userId) {
    return
  }

  if (stripeCustomerId) {
    await upsertBillingCustomer({
      userId,
      stripeCustomerId,
      email: session.customer_details?.email ?? session.customer_email ?? null,
    })
  }

  await upsertDayPassEntitlement({
    userId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: getStringPaymentIntentId(session.payment_intent),
    stripeCustomerId,
    email: session.customer_details?.email ?? session.customer_email ?? null,
    expiresAt: new Date(grantedAt * 1000 + 24 * 60 * 60 * 1000).toISOString(),
  })
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  const stripeCustomerId = getStringId(subscription.customer)
  const userId = await resolveUserId({
    stripeCustomerId,
    metadataUserId: getMetadataUserId(subscription.metadata),
  })

  if (!userId || !stripeCustomerId) {
    return
  }

  const planId = getPlanIdFromStripePriceId(subscription.items.data[0]?.price?.id)

  if (planId !== "monthly" && planId !== "annual") {
    return
  }

  await upsertBillingCustomer({
    userId,
    stripeCustomerId,
    email: subscription.metadata.email ?? null,
  })

  await upsertBillingSubscription({
    userId,
    stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    planId,
    status: subscription.status,
    currentPeriodEnd: getSubscriptionCurrentPeriodEnd(subscription),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    metadata: Object.fromEntries(Object.entries(subscription.metadata).map(([key, value]) => [key, value ?? ""])),
  })
}

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Paiement indisponible." }, { status: 503 })
    }

    if (!isBillingStoreConfigured()) {
      return NextResponse.json({ error: "Facturation indisponible." }, { status: 503 })
    }

    const webhookSecret = getStripeWebhookSecret()

    if (!webhookSecret) {
      return NextResponse.json({ error: "Configuration de paiement incomplète." }, { status: 503 })
    }

    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json({ error: "Signature de paiement manquante." }, { status: 400 })
    }

    const payload = await request.text()
    const stripe = getStripe()
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)

    switch (event.type) {
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.completed": {
        const session = event.data.object

        if (session.metadata?.planId === "day-pass") {
          await handleDayPassSession(session, event.created)
        }

        await markPromoRedemptionCompleted({
          redemptionId: session.metadata?.promoRedemptionId,
          stripeCheckoutSessionId: session.id,
        })
        await trackServerEvent(request, "checkout_completed_webhook", {
          planId: session.metadata?.planId ?? "unknown",
          promoCode: session.metadata?.promoCode ?? null,
          promoRedemptionId: session.metadata?.promoRedemptionId ?? null,
        })

        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await handleSubscriptionEvent(event.data.object)
        await trackServerEvent(request, "subscription_status_synced", {
          status: event.data.object.status,
          subscriptionId: event.data.object.id,
        })
        break
      }

      default:
        break
    }

    await markStripeEventProcessed({
      eventId: event.id,
      eventType: event.type,
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[label2a4-stripe-webhook]", error)
    return NextResponse.json({ error: "Notification de paiement invalide." }, { status: 400 })
  }
}
