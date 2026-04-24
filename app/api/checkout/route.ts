import { NextRequest, NextResponse } from "next/server"
import { ensureAnonymousId, getRequestOrigin } from "@/lib/access-control"
import { getOrCreateStripeCustomerForUser } from "@/lib/billing-service"
import type { PremiumPlanId } from "@/lib/monetization-types"
import {
  attachPromoRedemptionToCheckout,
  getOrCreateStripeCouponForPromo,
  reservePromoCodeForCheckout,
  type PromoReservation,
  voidPromoRedemption,
} from "@/lib/promo-codes"
import { consumeRateLimit } from "@/lib/rate-limit"
import { trackServerEvent } from "@/lib/server-analytics"
import { getStripe, getStripePriceId, isStripeConfigured } from "@/lib/stripe"
import { getAuthenticatedUser } from "@/lib/supabase/auth"
import { isSupabaseAuthConfigured } from "@/lib/supabase/config"

export const runtime = "nodejs"

function isPremiumPlanId(value: unknown): value is PremiumPlanId {
  return value === "monthly" || value === "annual" || value === "day-pass"
}

function buildStripeMetadata(input: {
  anonymousId: string
  planId: PremiumPlanId
  userEmail?: string | null
  userId?: string
}) {
  return {
    anonymousId: input.anonymousId,
    immediateAccessConsent: "true",
    planId: input.planId,
    ...(input.userId ? { userId: input.userId } : {}),
    ...(input.userEmail ? { email: input.userEmail } : {}),
    withdrawalWaiver: "true",
  }
}

export async function POST(request: NextRequest) {
  const cookieDraft = new NextResponse()
  let pendingPromoRedemptionId: string | null = null

  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Paiement indisponible pour le moment." },
        { status: 503 },
      )
    }

    const rateLimit = await consumeRateLimit(request, {
      bucket: "checkout",
      limit: 15,
      windowSeconds: 10 * 60,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives de paiement. Réessayez dans quelques minutes." },
        { status: 429 },
      )
    }

    const payload = (await request.json()) as {
      immediateAccessConsent?: boolean
      planId?: PremiumPlanId
      promoCode?: string
      withdrawalWaiver?: boolean
    }

    if (!isPremiumPlanId(payload.planId)) {
      return NextResponse.json({ error: "Offre premium inconnue." }, { status: 400 })
    }

    if (!payload.immediateAccessConsent || !payload.withdrawalWaiver) {
      return NextResponse.json(
        {
          error:
            "Vous devez confirmer l'activation immédiate du service et votre renonciation au droit de rétractation avant paiement.",
        },
        { status: 400 },
      )
    }

    const stripe = getStripe()
    const anonymousId = ensureAnonymousId(request, cookieDraft)
    const authenticatedUser = await getAuthenticatedUser(request, cookieDraft)
    const authModeEnabled = isSupabaseAuthConfigured()
    const origin = getRequestOrigin(request)
    const priceId = getStripePriceId(payload.planId)

    if (authModeEnabled && !authenticatedUser) {
      return NextResponse.json(
        {
          code: "auth_required",
          error: "Connectez-vous pour continuer votre achat premium.",
          redirectTo: `/compte?checkoutPlan=${encodeURIComponent(payload.planId)}`,
        },
        { status: 401 },
      )
    }

    if (!priceId) {
      return NextResponse.json({ error: "Paiement indisponible pour cette offre." }, { status: 503 })
    }

    let promoReservation: PromoReservation | null = null
    let stripeCouponId: string | null = null

    if (payload.promoCode?.trim()) {
      const reservedPromo = await reservePromoCodeForCheckout({
        anonymousId,
        code: payload.promoCode,
        planId: payload.planId,
        userId: authenticatedUser?.id,
      })

      if ("valid" in reservedPromo) {
        return NextResponse.json(
          {
            code: "promo_invalid",
            error: reservedPromo.message,
            promo: reservedPromo,
          },
          { status: 400 },
        )
      }

      promoReservation = reservedPromo
      pendingPromoRedemptionId = promoReservation.redemptionId

      if (promoReservation.promo.kind !== "trial") {
        stripeCouponId = await getOrCreateStripeCouponForPromo(stripe, promoReservation.promo)
      }
    }

    const stripeMetadata = buildStripeMetadata({
      anonymousId,
      planId: payload.planId,
      userEmail: authenticatedUser?.email,
      userId: authenticatedUser?.id,
    })
    const sessionMetadata = {
      ...stripeMetadata,
      ...(promoReservation
        ? {
            promoCode: promoReservation.quote.code,
            promoKind: promoReservation.quote.kind,
            promoRedemptionId: promoReservation.redemptionId,
            ...(promoReservation.quote.trialDays ? { promoTrialDays: String(promoReservation.quote.trialDays) } : {}),
          }
        : {}),
    }
    const stripeCustomerId = authenticatedUser
      ? await getOrCreateStripeCustomerForUser({
          userId: authenticatedUser.id,
          email: authenticatedUser.email,
        })
      : null

    const session = await stripe.checkout.sessions.create({
      billing_address_collection: "auto",
      cancel_url: `${origin}/paiement/annule`,
      client_reference_id: authenticatedUser?.id ?? anonymousId,
      ...(stripeCustomerId ? { customer: stripeCustomerId } : {}),
      custom_text: {
        submit: {
          message:
            "En payant, vous demandez l'activation immédiate du service premium et renoncez à votre droit de rétractation une fois l'accès activé.",
        },
      },
      ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
      line_items: [{ price: priceId, quantity: 1 }],
      locale: "fr",
      metadata: sessionMetadata,
      mode: payload.planId === "day-pass" ? "payment" : "subscription",
      success_url: `${origin}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      ...(payload.planId === "day-pass"
        ? {
            ...(!stripeCustomerId
              ? {
                  customer_creation: "if_required" as const,
                }
              : {}),
            invoice_creation: {
              enabled: true,
            },
            payment_intent_data: {
              metadata: sessionMetadata,
            },
          }
        : {
            payment_method_collection: "always" as const,
            subscription_data: {
              metadata: sessionMetadata,
              ...(promoReservation?.quote.trialDays
                ? {
                    trial_period_days: promoReservation.quote.trialDays,
                    trial_settings: {
                      end_behavior: {
                        missing_payment_method: "cancel" as const,
                      },
                    },
                  }
                : {}),
            },
          }),
    })

    if (promoReservation) {
      await attachPromoRedemptionToCheckout({
        redemptionId: promoReservation.redemptionId,
        stripeCheckoutSessionId: session.id,
        stripeCustomerId: typeof session.customer === "string" ? session.customer : stripeCustomerId,
      })
    }

    const response = NextResponse.json({ url: session.url })
    cookieDraft.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
    await trackServerEvent(request, "checkout_session_created", {
      mode: payload.planId === "day-pass" ? "payment" : "subscription",
      planId: payload.planId,
      promoCode: promoReservation?.quote.code ?? null,
      promoKind: promoReservation?.quote.kind ?? null,
    })
    return response
  } catch (error) {
    await voidPromoRedemption(pendingPromoRedemptionId).catch((voidError) => {
      console.error("[label2a4-promo-void]", voidError)
    })
    console.error("[label2a4-checkout]", error)
    return NextResponse.json({ error: "Impossible de démarrer le paiement." }, { status: 500 })
  }
}
