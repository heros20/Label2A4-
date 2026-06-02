import { NextResponse } from "next/server"
import {
  DESKTOP_APP_FILE_NAME,
  getDesktopAppDownload,
  getDesktopAppDownloadUrl,
} from "@/lib/desktop-app"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const downloadUrl = await getDesktopAppDownloadUrl()

  if (downloadUrl) {
    return NextResponse.redirect(downloadUrl, 302)
  }

  const download = await getDesktopAppDownload()

  if (!download) {
    return NextResponse.json({ error: "Application bureau indisponible." }, { status: 404 })
  }

  return new NextResponse(download.bytes as BodyInit, {
    headers: {
      "Content-Disposition": `attachment; filename="${DESKTOP_APP_FILE_NAME}"`,
      "Content-Length": String(download.sizeBytes),
      "Content-Type": "application/vnd.microsoft.portable-executable",
    },
  })
}
