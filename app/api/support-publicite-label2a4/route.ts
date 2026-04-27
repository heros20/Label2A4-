import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { NextRequest, NextResponse } from "next/server"

const flyerFilePath = join(process.cwd(), "support-publicite-label2a4-a4.html")
const publicAssetBaseUrl = "https://label2a4.com"

export const dynamic = "force-dynamic"

function getProtectedFlyerHtml(source: string) {
  return source.replaceAll('src="public/', `src="${publicAssetBaseUrl}/`)
}

export async function GET(request: NextRequest) {
  const source = await readFile(flyerFilePath, "utf8")
  const html = getProtectedFlyerHtml(source)
  const shouldDownload = request.nextUrl.searchParams.get("download") === "1"

  return new NextResponse(html, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": shouldDownload
        ? 'attachment; filename="flyer-label2a4-a4.html"'
        : 'inline; filename="flyer-label2a4-a4.html"',
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  })
}
