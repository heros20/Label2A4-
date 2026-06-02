import { NextRequest, NextResponse } from "next/server"
import { isAdminDashboardConfigured, isAdminRequestAuthenticated } from "@/lib/admin-auth"
import { saveDesktopAppInstaller } from "@/lib/desktop-app"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  if (!isAdminDashboardConfigured()) {
    return jsonError("ADMIN_DASHBOARD_TOKEN manquant.", 503)
  }

  if (!isAdminRequestAuthenticated(request)) {
    return jsonError("Session admin invalide.", 401)
  }

  try {
    const formData = await request.formData()
    const file = formData.get("installer")

    if (!(file instanceof File)) {
      return jsonError("Fichier setup.exe manquant.", 400)
    }

    const info = await saveDesktopAppInstaller(file)
    return NextResponse.json({
      ok: true,
      file: {
        exists: info.exists,
        fileName: info.fileName,
        sizeBytes: info.sizeBytes,
        updatedAt: info.updatedAt?.toISOString() ?? null,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de remplacer l'application bureau."
    console.error("[label2a4-admin-desktop-app-upload]", error)
    return jsonError(message, 400)
  }
}
