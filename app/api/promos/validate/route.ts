import { NextRequest, NextResponse } from "next/server"
import { ensureAnonymousId } from "@/lib/access-control"
import type { PremiumPlanId } from "@/lib/monetization-types"
import { consumeRateLimit } from "@/lib/rate-limit"
import { validatePromoCodeForPlan } from "@/lib/promo-codes"
import { getAuthenticatedUser } from "@/lib/supabase/auth"

export const runtime = "nodejs"

function isPremiumPlanId(value: unknown): value is PremiumPlanId {
  return value === "monthly" || value === "annual" || value === "day-pass"
}

export async function POST(request: NextRequest) {
  const cookieDraft = new NextResponse()

  try {
    const rateLimit = await consumeRateLimit(request, {
      bucket: "promo-validate",
      limit: 30,
      windowSeconds: 10 * 60,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "Trop de tentatives de codes promo. Réessayez dans quelques minutes.", status: "exhausted", valid: false },
        { status: 429 },
      )
    }

    const payload = (await request.json()) as {
      code?: string
      planId?: PremiumPlanId
    }

    if (!isPremiumPlanId(payload.planId)) {
      return NextResponse.json(
        { message: "Offre premium inconnue.", status: "incompatible_plan", valid: false },
        { status: 400 },
      )
    }

    const anonymousId = ensureAnonymousId(request, cookieDraft)
    const authenticatedUser = await getAuthenticatedUser(request, cookieDraft)
    const validation = await validatePromoCodeForPlan({
      anonymousId,
      code: payload.code ?? "",
      planId: payload.planId,
      userId: authenticatedUser?.id,
    })
    const response = NextResponse.json(validation.payload, { status: validation.payload.valid ? 200 : 400 })

    cookieDraft.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
    return response
  } catch (error) {
    console.error("[label2a4-promo-validate]", error)
    return NextResponse.json(
      { message: "Impossible de vérifier ce code promo.", status: "invalid", valid: false },
      { status: 500 },
    )
  }
}

