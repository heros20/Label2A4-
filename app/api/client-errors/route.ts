import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      context?: Record<string, unknown>
      message?: string
      source?: string
    }

    if (!payload.source || !payload.message) {
      return NextResponse.json({ error: "Payload invalide." }, { status: 400 })
    }

    console.error(
      "[label2a4-client]",
      JSON.stringify({
        ts: new Date().toISOString(),
        source: payload.source,
        message: payload.message,
        context: payload.context ?? {},
      }),
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[label2a4-client]", error)
    return NextResponse.json({ error: "Impossible d'enregistrer l'erreur." }, { status: 500 })
  }
}
