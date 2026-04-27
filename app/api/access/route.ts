import { NextRequest, NextResponse } from "next/server"
import { getAccessSnapshot } from "@/lib/access-control"
import { getRequestLocaleFromRequest } from "@/lib/request-locale"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const cookieDraft = new NextResponse()
  const locale = getRequestLocaleFromRequest(request)

  try {
    const access = await getAccessSnapshot(request, cookieDraft)
    const response = NextResponse.json({ access })

    cookieDraft.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))

    return response
  } catch (error) {
    console.error("[label2a4-access]", error)
    return NextResponse.json(
      {
        error:
          locale === "en"
            ? "Unable to load your access status."
            : "Impossible de charger votre statut d'accès.",
      },
      { status: 500 },
    )
  }
}
