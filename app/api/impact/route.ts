import { NextRequest, NextResponse } from "next/server"
import { ensureAnonymousId } from "@/lib/access-control"
import { getImpactSnapshot } from "@/lib/impact-store"
import { getAuthenticatedUser } from "@/lib/supabase/auth"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const cookieDraft = new NextResponse()

  try {
    const anonymousId = ensureAnonymousId(request, cookieDraft)
    const authenticatedUser = await getAuthenticatedUser(request, cookieDraft)
    const impact = await getImpactSnapshot({
      anonymousId,
      userId: authenticatedUser?.id,
    })
    const response = NextResponse.json({ impact })

    cookieDraft.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
    return response
  } catch (error) {
    console.error("[label2a4-impact]", error)
    return NextResponse.json({ error: "Impossible de charger le compteur écologique." }, { status: 500 })
  }
}

