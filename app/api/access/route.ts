import { NextRequest, NextResponse } from "next/server"
import { getAccessSnapshot } from "@/lib/access-control"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const cookieDraft = new NextResponse()

  try {
    const access = await getAccessSnapshot(request, cookieDraft)
    const response = NextResponse.json({ access })

    cookieDraft.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))

    return response
  } catch (error) {
    console.error("[label2a4-access]", error)
    return NextResponse.json({ error: "Impossible de charger votre statut d'accès." }, { status: 500 })
  }
}
