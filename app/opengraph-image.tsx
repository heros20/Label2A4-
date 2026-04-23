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
          justifyContent: "center",
          background: "#f8fbfd",
          gap: "22px",
          padding: "64px",
        }}
      >
        <img
          src={logoSrc}
          alt={siteConfig.siteName}
          style={{
            width: 760,
            height: 414,
            objectFit: "contain",
          }}
        />
        <div
          style={{
            color: "#0f172a",
            fontSize: 54,
            fontWeight: 800,
            letterSpacing: 0,
            lineHeight: 1.12,
            textAlign: "center",
          }}
        >
          {siteConfig.primarySlogan}
        </div>
        <div
          style={{
            color: "#0369a1",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 0,
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          Imprime malin, économise du papier.
        </div>
      </div>
    ),
    size,
  )
}
