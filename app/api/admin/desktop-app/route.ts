import { NextRequest, NextResponse } from "next/server"
import { isAdminDashboardConfigured, isAdminRequestAuthenticated } from "@/lib/admin-auth"
import {
  getDesktopAppFileInfo,
  saveDesktopAppReleaseUrl,
} from "@/lib/desktop-app"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

interface DesktopAppAdminPayload {
  action?: unknown
  downloadUrl?: unknown
}

export async function POST(request: NextRequest) {
  if (!isAdminDashboardConfigured()) {
    return jsonError("ADMIN_DASHBOARD_TOKEN manquant.", 503)
  }

  if (!isAdminRequestAuthenticated(request)) {
    return jsonError("Session admin invalide.", 401)
  }

  try {
    const payload = (await request.json()) as DesktopAppAdminPayload
    const action = typeof payload.action === "string" ? payload.action : ""

    if (action === "update-release-url") {
      if (typeof payload.downloadUrl !== "string") {
        return jsonError("URL GitHub Release manquante.", 400)
      }

      const info = await saveDesktopAppReleaseUrl(payload.downloadUrl)
      return NextResponse.json({
        ok: true,
        file: {
          downloadUrl: info.downloadUrl,
          exists: info.exists,
          fileName: info.fileName,
          source: info.source,
          sizeBytes: info.sizeBytes,
          updatedAt: info.updatedAt?.toISOString() ?? null,
        },
      })
    }

    if (action === "status") {
      const info = await getDesktopAppFileInfo()
      return NextResponse.json({ ok: true, file: info })
    }

    return jsonError("Action admin inconnue.", 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de remplacer l'application bureau."
    console.error("[label2a4-admin-desktop-app-upload]", error)
    return jsonError(message, 400)
  }
}
