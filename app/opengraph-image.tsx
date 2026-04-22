import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { siteConfig } from "@/lib/site-config"

export const runtime = "nodejs"
export const alt = "Label2A4 - etiquettes PDF en A4 x4"
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
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fbfd",
          padding: "48px",
        }}
      >
        <img
          src={logoSrc}
          alt={siteConfig.siteName}
          style={{
            width: 1060,
            height: 578,
            objectFit: "contain",
          }}
        />
      </div>
    ),
    size,
  )
}
