import { NextRequest, NextResponse } from "next/server"
import { getPlanCookiePayload, getRequestOrigin } from "@/lib/access-control"
import { trackServerEvent } from "@/lib/server-analytics"
import { getStripe, isStripeConfigured } from "@/lib/stripe"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe n'est pas configuré." }, { status: 503 })
    }

    const storedPlan = getPlanCookiePayload(request)
    if (!storedPlan?.customerId) {
      return NextResponse.json(
        { error: "Aucun abonnement facturable n'est associé à ce navigateur." },
        { status: 400 },
      )
    }

    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: storedPlan.customerId,
      ...(process.env.STRIPE_BILLING_PORTAL_CONFIGURATION
        ? {
            configuration: process.env.STRIPE_BILLING_PORTAL_CONFIGURATION,
          }
        : {}),
      return_url: `${getRequestOrigin(request)}/compte`,
    })

    await trackServerEvent(request, "billing_portal_session_created", {
      hasConfiguration: Boolean(process.env.STRIPE_BILLING_PORTAL_CONFIGURATION),
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[label2a4-billing-portal]", error)
    return NextResponse.json({ error: "Portail de facturation indisponible." }, { status: 500 })
  }
}
