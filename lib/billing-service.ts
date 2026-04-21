import "server-only"
import { getBillingCustomerByUserId, upsertBillingCustomer } from "@/lib/billing-store"
import { getStripe } from "@/lib/stripe"

function isMissingStripeCustomerError(error: unknown) {
  const stripeError = error as {
    code?: string
    message?: string
    param?: string
    raw?: {
      code?: string
      message?: string
      param?: string
    }
    type?: string
  }
  const isMissingResource = stripeError.code === "resource_missing" || stripeError.raw?.code === "resource_missing"
  const missingCustomerMessage =
    stripeError.message?.includes("No such customer") || stripeError.raw?.message?.includes("No such customer")

  return (
    stripeError.type === "StripeInvalidRequestError" &&
    isMissingResource &&
    (stripeError.param === "customer" || stripeError.raw?.param === "customer" || missingCustomerMessage)
  )
}

async function createStripeCustomerForUser(input: { email?: string | null; userId: string }) {
  const stripe = getStripe()
  const customer = await stripe.customers.create({
    email: input.email ?? undefined,
    metadata: {
      userId: input.userId,
    },
  })

  await upsertBillingCustomer({
    userId: input.userId,
    stripeCustomerId: customer.id,
    email: input.email,
  })

  return customer.id
}

export async function getOrCreateStripeCustomerForUser(input: { userId: string; email?: string | null }) {
  const existingCustomer = await getBillingCustomerByUserId(input.userId)
  const stripe = getStripe()

  if (existingCustomer?.stripe_customer_id) {
    try {
      const stripeCustomer = await stripe.customers.retrieve(existingCustomer.stripe_customer_id)

      if (stripeCustomer.deleted) {
        return await createStripeCustomerForUser(input)
      }

      if (input.email && input.email !== existingCustomer.email) {
        await stripe.customers.update(existingCustomer.stripe_customer_id, {
          email: input.email,
          metadata: {
            userId: input.userId,
          },
        })

        await upsertBillingCustomer({
          userId: input.userId,
          stripeCustomerId: existingCustomer.stripe_customer_id,
          email: input.email,
        })
      }

      return existingCustomer.stripe_customer_id
    } catch (error) {
      if (isMissingStripeCustomerError(error)) {
        console.warn("[label2a4-billing-customer-stale]", {
          stripeCustomerId: existingCustomer.stripe_customer_id,
          userId: input.userId,
        })
        return await createStripeCustomerForUser(input)
      }

      throw error
    }
  }

  return await createStripeCustomerForUser(input)
}
