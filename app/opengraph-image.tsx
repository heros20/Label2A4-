import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { siteConfig } from "@/lib/site-config"

export const runtime = "nodejs"
export const alt = "Fini le gaspillage. Imprime 4 étiquettes sur une seule feuille A4."
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public", "images", "logo", "label2a4.png"))
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          background: "#f8fbfd",
          gap: "10px",
          padding: "28px 72px 72px",
        }}
      >
        <img
          src={logoSrc}
          alt={siteConfig.siteName}
          style={{
            width: 720,
            height: 392,
            objectFit: "contain",
          }}
        />
        <div
          style={{
            color: "#0f172a",
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: 0,
            lineHeight: 1.08,
            maxWidth: 1040,
            textAlign: "center",
          }}
        >
          {siteConfig.socialTagline}
        </div>
      </div>
    ),
    size,
  )
}
