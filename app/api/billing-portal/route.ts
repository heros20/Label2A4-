import { NextRequest, NextResponse } from "next/server"
import { getPlanCookiePayload, getRequestOrigin } from "@/lib/access-control"
import { getBillingCustomerByUserId } from "@/lib/billing-store"
import { localizePath } from "@/lib/i18n"
import { getRequestLocaleFromRequest } from "@/lib/request-locale"
import { trackServerEvent } from "@/lib/server-analytics"
import { getStripe, isStripeConfigured } from "@/lib/stripe"
import { getAuthenticatedUser } from "@/lib/supabase/auth"
import { isSupabaseAuthConfigured } from "@/lib/supabase/config"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const cookieDraft = new NextResponse()
  const locale = getRequestLocaleFromRequest(request)

  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: locale === "en" ? "Billing portal unavailable." : "Portail de facturation indisponible." },
        { status: 503 },
      )
    }

    let customerId: string | undefined

    if (isSupabaseAuthConfigured()) {
      const authenticatedUser = await getAuthenticatedUser(request, cookieDraft)

      if (!authenticatedUser) {
        return NextResponse.json(
          {
            error:
              locale === "en"
                ? "Sign in to your account to open the billing portal."
                : "Connectez-vous à votre compte pour ouvrir le portail de facturation.",
          },
          { status: 401 },
        )
      }

      customerId = (await getBillingCustomerByUserId(authenticatedUser.id))?.stripe_customer_id

      if (!customerId) {
        return NextResponse.json(
          {
            error:
              locale === "en"
                ? "No billing portal is attached to this account yet."
                : "Aucun portail de facturation n'est encore rattaché à ce compte.",
          },
          { status: 400 },
        )
      }
    } else {
      customerId = getPlanCookiePayload(request)?.customerId

      if (!customerId) {
        return NextResponse.json(
          {
            error:
              locale === "en"
                ? "No billable subscription is linked to this browser."
                : "Aucun abonnement facturable n'est associé à ce navigateur.",
          },
          { status: 400 },
        )
      }
    }

    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      ...(process.env.STRIPE_BILLING_PORTAL_CONFIGURATION
        ? {
            configuration: process.env.STRIPE_BILLING_PORTAL_CONFIGURATION,
          }
        : {}),
      return_url: `${getRequestOrigin(request)}${localizePath("/compte", locale)}`,
    })

    const response = NextResponse.json({ url: session.url })
    cookieDraft.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))

    await trackServerEvent(request, "billing_portal_session_created", {
      hasConfiguration: Boolean(process.env.STRIPE_BILLING_PORTAL_CONFIGURATION),
    })

    return response
  } catch (error) {
    console.error("[label2a4-billing-portal]", error)
    return NextResponse.json(
      { error: locale === "en" ? "Billing portal unavailable." : "Portail de facturation indisponible." },
      { status: 500 },
    )
  }
}
