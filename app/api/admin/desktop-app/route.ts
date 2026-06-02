import { NextRequest, NextResponse } from "next/server"
import { isAdminDashboardConfigured, isAdminRequestAuthenticated } from "@/lib/admin-auth"
import {
  DESKTOP_APP_BUCKET,
  createDesktopAppSignedUpload,
  getDesktopAppFileInfo,
} from "@/lib/desktop-app"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

interface DesktopAppAdminPayload {
  action?: unknown
  fileName?: unknown
  sizeBytes?: unknown
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

    if (action === "prepare-upload") {
      if (typeof payload.fileName !== "string" || typeof payload.sizeBytes !== "number") {
        return jsonError("Informations du fichier manquantes.", 400)
      }

      const signedUpload = await createDesktopAppSignedUpload(payload.fileName, payload.sizeBytes)
      return NextResponse.json({
        ok: true,
        upload: {
          bucket: DESKTOP_APP_BUCKET,
          path: signedUpload.path,
          token: signedUpload.token,
        },
      })
    }

    if (action === "complete-upload") {
      const info = await getDesktopAppFileInfo()

      if (!info.exists) {
        return jsonError("Upload non retrouve dans le stockage.", 400)
      }

      return NextResponse.json({
        ok: true,
        file: {
          exists: info.exists,
          fileName: info.fileName,
          sizeBytes: info.sizeBytes,
          updatedAt: info.updatedAt?.toISOString() ?? null,
        },
      })
    }

    return jsonError("Action admin inconnue.", 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de remplacer l'application bureau."
    console.error("[label2a4-admin-desktop-app-upload]", error)
    return jsonError(message, 400)
  }
}
