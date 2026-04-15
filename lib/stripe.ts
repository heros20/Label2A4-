import Stripe from "stripe"
import type { PremiumPlanId } from "@/lib/monetization-types"

let stripeInstance: Stripe | null = null

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_MONTHLY &&
      process.env.STRIPE_PRICE_ANNUAL &&
      process.env.STRIPE_PRICE_DAY_PASS,
  )
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET ?? ""
}

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY manquant.")
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey)
  }

  return stripeInstance
}

export function getStripePriceId(planId: PremiumPlanId) {
  if (planId === "monthly") {
    return process.env.STRIPE_PRICE_MONTHLY ?? ""
  }

  if (planId === "annual") {
    return process.env.STRIPE_PRICE_ANNUAL ?? ""
  }

  return process.env.STRIPE_PRICE_DAY_PASS ?? ""
}

export function getPlanIdFromStripePriceId(priceId: string | undefined | null): PremiumPlanId | null {
  if (!priceId) {
    return null
  }

  if (priceId === process.env.STRIPE_PRICE_MONTHLY) {
    return "monthly"
  }

  if (priceId === process.env.STRIPE_PRICE_ANNUAL) {
    return "annual"
  }

  if (priceId === process.env.STRIPE_PRICE_DAY_PASS) {
    return "day-pass"
  }

  return null
}
