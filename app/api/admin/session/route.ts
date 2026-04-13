import { NextRequest, NextResponse } from "next/server"
import {
  clearAdminSessionCookie,
  isAdminDashboardConfigured,
  isValidAdminToken,
  setAdminSessionCookie,
} from "@/lib/admin-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    if (!isAdminDashboardConfigured()) {
      return NextResponse.json({ error: "ADMIN_DASHBOARD_TOKEN manquant." }, { status: 503 })
    }

    const payload = (await request.json()) as { token?: string }
    if (!payload.token || !isValidAdminToken(payload.token)) {
      return NextResponse.json({ error: "Token admin invalide." }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    setAdminSessionCookie(response)
    return response
  } catch (error) {
    console.error("[label2a4-admin-session]", error)
    return NextResponse.json({ error: "Impossible d’ouvrir la session admin." }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  clearAdminSessionCookie(response)
  return response
}
