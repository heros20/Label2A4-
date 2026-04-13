import { NextRequest, NextResponse } from "next/server"
import {
  ensureAnonymousId,
  setDayPassPlanCookie,
  setSubscriptionPlanCookie,
} from "@/lib/access-control"
import { trackServerEvent } from "@/lib/server-analytics"
import { getStripe, isStripeConfigured } from "@/lib/stripe"

export const runtime = "nodejs"

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie))
}

function buildRedirect(request: NextRequest, pathname: string) {
  return new URL(pathname, request.url)
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
    } else if (
      (planId === "monthly" || planId === "annual") &&
      customerId &&
      subscriptionId
    ) {
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
