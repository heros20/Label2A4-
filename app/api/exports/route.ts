import { NextRequest, NextResponse } from "next/server"
import { consumeExportQuota } from "@/lib/access-control"
import { trackServerEvent } from "@/lib/server-analytics"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const cookieDraft = new NextResponse()

  try {
    const payload = (await request.json()) as {
      action?: "download" | "print"
      fileName?: string
      sheetCount?: number
    }

    if (!payload.action || !["download", "print"].includes(payload.action)) {
      return NextResponse.json({ error: "Action d'export invalide." }, { status: 400 })
    }

    if (
      typeof payload.sheetCount !== "number" ||
      !Number.isFinite(payload.sheetCount) ||
      payload.sheetCount <= 0
    ) {
      return NextResponse.json({ error: "Nombre de planches invalide." }, { status: 400 })
    }

    const decision = await consumeExportQuota(request, cookieDraft, {
      action: payload.action,
      fileName: payload.fileName,
      sheetCount: Math.ceil(payload.sheetCount),
    })

    await trackServerEvent(request, decision.allowed ? "export_validated" : "quota_exceeded", {
      action: payload.action,
      sheetCount: Math.ceil(payload.sheetCount),
    })

    const response = NextResponse.json(decision, { status: decision.allowed ? 200 : 403 })
    cookieDraft.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
    return response
  } catch (error) {
    console.error("[label2a4-export]", error)
    return NextResponse.json({ error: "Impossible de valider l'export." }, { status: 500 })
  }
}
