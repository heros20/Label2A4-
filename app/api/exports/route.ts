import { NextRequest, NextResponse } from "next/server"
import { consumeExportQuota } from "@/lib/access-control"
import { calculateLabelImpact } from "@/lib/impact"
import { recordExportImpact } from "@/lib/impact-store"
import type { ImpactSnapshot } from "@/lib/monetization-types"
import { consumeRateLimit } from "@/lib/rate-limit"
import { trackServerEvent } from "@/lib/server-analytics"

export const runtime = "nodejs"

function normalizeExportCounts(input: { labelCount?: number; sheetCount?: number }) {
  const sheetCount = Math.ceil(input.sheetCount ?? 0)

  if (!Number.isFinite(sheetCount) || sheetCount <= 0) {
    return null
  }

  const rawLabelCount = Math.ceil(input.labelCount ?? sheetCount * 4)

  if (!Number.isFinite(rawLabelCount) || rawLabelCount <= 0) {
    return null
  }

  return {
    labelCount: Math.min(Math.max(rawLabelCount, 1), sheetCount * 4),
    sheetCount,
  }
}

export async function POST(request: NextRequest) {
  const cookieDraft = new NextResponse()

  try {
    const rateLimit = await consumeRateLimit(request, {
      bucket: "export",
      limit: 40,
      windowSeconds: 10 * 60,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop d'exports lancés en peu de temps. Réessayez dans quelques minutes." },
        { status: 429 },
      )
    }

    const payload = (await request.json()) as {
      action?: "download" | "print"
      fileName?: string
      labelCount?: number
      sheetCount?: number
    }

    if (!payload.action || !["download", "print"].includes(payload.action)) {
      return NextResponse.json({ error: "Action d'export invalide." }, { status: 400 })
    }

    const exportCounts = normalizeExportCounts(payload)

    if (!exportCounts) {
      return NextResponse.json({ error: "Nombre de planches invalide." }, { status: 400 })
    }

    const decision = await consumeExportQuota(request, cookieDraft, {
      action: payload.action,
      fileName: payload.fileName,
      sheetCount: exportCounts.sheetCount,
    })

    const impact = calculateLabelImpact({
      labelCount: exportCounts.labelCount,
      optimizedSheetCount: exportCounts.sheetCount,
    })
    let impactSnapshot: ImpactSnapshot | undefined

    if (decision.allowed) {
      try {
        impactSnapshot = (
          await recordExportImpact({
            anonymousId: decision.snapshot.anonymousId,
            labelCount: exportCounts.labelCount,
            optimizedSheetCount: exportCounts.sheetCount,
            userId: decision.snapshot.userId,
          })
        ).snapshot
      } catch (error) {
        console.error("[label2a4-impact-record]", error)
      }
    }

    await trackServerEvent(request, decision.allowed ? "export_validated" : "quota_exceeded", {
      action: payload.action,
      labelCount: exportCounts.labelCount,
      sheetCount: exportCounts.sheetCount,
      sheetsSaved: impact.sheetsSaved,
    })

    const response = NextResponse.json(
      {
        ...decision,
        impact: impactSnapshot,
      },
      { status: decision.allowed ? 200 : 403 },
    )
    cookieDraft.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
    return response
  } catch (error) {
    console.error("[label2a4-export]", error)
    return NextResponse.json({ error: "Impossible de valider l'export." }, { status: 500 })
  }
}
