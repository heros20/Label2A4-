import { NextRequest, NextResponse } from "next/server"
import {
  ensureAnonymousId,
  setDayPassPlanCookie,
  setSubscriptionPlanCookie,
} from "@/lib/access-control"
import { upsertBillingCustomer, upsertDayPassEntitlement } from "@/lib/billing-store"
import { trackServerEvent } from "@/lib/server-analytics"
import { getStripe, isStripeConfigured } from "@/lib/stripe"
import { isSupabaseAuthConfigured } from "@/lib/supabase/config"

export const runtime = "nodejs"

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie))
}

function buildRedirect(request: NextRequest, pathname: string) {
  return new URL(pathname, request.url)
}

function getStringId(value: string | { id: string } | null) {
  if (!value) {
    return null
  }

  return typeof value === "string" ? value : value.id
}

function getMetadataUserId(metadata?: Record<string, string> | null) {
  const value = metadata?.userId?.trim()
  return value ? value : null
}

export async function GET(request: NextRequest) {
  const cookieDraft = new NextResponse()

  try {
    if (!isStripeConfigured()) {
      return NextResponse.redirect(buildRedirect(request, "/paiement/annule"))
    }

    const sessionId = request.nextUrl.searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.redirect(buildRedirect(request, "/paiement/annule"))
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    })

    if (session.status !== "complete") {
      return NextResponse.redirect(buildRedirect(request, "/paiement/annule"))
    }

    const planId = session.metadata?.planId

    if (isSupabaseAuthConfigured()) {
      const userId = getMetadataUserId(session.metadata)
      const customerId = getStringId(session.customer)

      if (planId === "day-pass") {
        if (session.payment_status !== "paid" || !userId) {
          return NextResponse.redirect(buildRedirect(request, "/paiement/annule"))
        }

        if (customerId) {
          await upsertBillingCustomer({
            userId,
            stripeCustomerId: customerId,
            email: session.customer_details?.email ?? session.customer_email ?? null,
          })
        }

        await upsertDayPassEntitlement({
          userId,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: getStringId(session.payment_intent),
          stripeCustomerId: customerId,
          email: session.customer_details?.email ?? session.customer_email ?? null,
          expiresAt: new Date(session.created * 1000 + 24 * 60 * 60 * 1000).toISOString(),
        })
      }
    } else {
      const anonymousId = ensureAnonymousId(request, cookieDraft)
      const customerId = typeof session.customer === "string" ? session.customer : undefined
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id
      const email = session.customer_details?.email ?? undefined

      if (planId === "day-pass") {
        setDayPassPlanCookie(cookieDraft, {
          anonymousId,
          customerId,
          email,
        })
      } else if ((planId === "monthly" || planId === "annual") && customerId && subscriptionId) {
        setSubscriptionPlanCookie(cookieDraft, {
          anonymousId,
          customerId,
          email,
          planId,
          subscriptionId,
        })
      } else {
        return NextResponse.redirect(buildRedirect(request, "/paiement/annule"))
      }
    }

    const response = NextResponse.redirect(buildRedirect(request, "/paiement/succes"))
    copyCookies(cookieDraft, response)
    await trackServerEvent(request, "checkout_completed", {
      mode: planId === "day-pass" ? "payment" : "subscription",
      planId: planId ?? "unknown",
    })
    return response
  } catch (error) {
    console.error("[label2a4-checkout-success]", error)
    const response = NextResponse.redirect(buildRedirect(request, "/paiement/annule"))
    copyCookies(cookieDraft, response)
    return response
  }
}
