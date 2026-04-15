import "server-only"
import { getBillingCustomerByUserId, upsertBillingCustomer } from "@/lib/billing-store"
import { getStripe } from "@/lib/stripe"

export async function getOrCreateStripeCustomerForUser(input: { userId: string; email?: string | null }) {
  const existingCustomer = await getBillingCustomerByUserId(input.userId)
  const stripe = getStripe()

  if (existingCustomer?.stripe_customer_id) {
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
  }

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
