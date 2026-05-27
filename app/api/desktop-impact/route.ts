import { NextRequest, NextResponse } from "next/server"
import { recordExportImpact } from "@/lib/impact-store"
import { consumeRateLimit } from "@/lib/rate-limit"
import { getRequestLocaleFromRequest } from "@/lib/request-locale"
import { trackServerEvent } from "@/lib/server-analytics"

export const runtime = "nodejs"

function normalizeDesktopImpactCounts(input: { labelCount?: number; sheetCount?: number }) {
  const sheetCount = Math.ceil(Number(input.sheetCount ?? 0))

  if (!Number.isFinite(sheetCount) || sheetCount <= 0) {
    return null
  }

  const rawLabelCount = Math.ceil(Number(input.labelCount ?? sheetCount * 4))

  if (!Number.isFinite(rawLabelCount) || rawLabelCount <= 0) {
    return null
  }

  return {
    labelCount: Math.min(Math.max(rawLabelCount, 1), sheetCount * 4),
    sheetCount,
  }
}

function normalizeInstallationId(value: unknown) {
  const rawValue = typeof value === "string" ? value.trim() : ""
  const safeValue = rawValue.replace(/[^a-zA-Z0-9._:-]/g, "").slice(0, 96)

  return safeValue || "unknown"
}

export async function POST(request: NextRequest) {
  const locale = getRequestLocaleFromRequest(request)

  try {
    const rateLimit = await consumeRateLimit(request, {
      bucket: "desktop-impact",
      limit: 120,
      windowSeconds: 10 * 60,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error:
            locale === "en"
              ? "Too many desktop impact updates were sent in a short time."
              : "Trop de mises à jour du compteur bureau ont été envoyées en peu de temps.",
        },
        { status: 429 },
      )
    }

    const payload = (await request.json()) as {
      action?: "download" | "print"
      installationId?: string
      labelCount?: number
      sheetCount?: number
      sourceFileCount?: number
      appVersion?: string
    }

    const impactCounts = normalizeDesktopImpactCounts(payload)

    if (!impactCounts) {
      return NextResponse.json(
        { error: locale === "en" ? "Invalid desktop impact counts." : "Compteurs bureau invalides." },
        { status: 400 },
      )
    }

    const anonymousId = `desktop:${normalizeInstallationId(payload.installationId)}`

    const result = await recordExportImpact({
      anonymousId,
      labelCount: impactCounts.labelCount,
      optimizedSheetCount: impactCounts.sheetCount,
    })

    await trackServerEvent(request, "desktop_impact_recorded", {
      action: payload.action === "print" ? "print" : "download",
      appVersion: payload.appVersion,
      labelCount: impactCounts.labelCount,
      sheetCount: impactCounts.sheetCount,
      sourceFileCount: payload.sourceFileCount,
      sheetsSaved: result.impact.sheetsSaved,
    })

    return NextResponse.json({
      impact: result.impact,
      snapshot: result.snapshot,
    })
  } catch (error) {
    console.error("[label2a4-desktop-impact]", error)

    return NextResponse.json(
      {
        error:
          locale === "en"
            ? "Unable to record the desktop environmental counter."
            : "Impossible d'enregistrer le compteur écologique bureau.",
      },
      { status: 500 },
    )
  }
}