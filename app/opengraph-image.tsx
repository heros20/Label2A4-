import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Label2A4 - étiquettes PDF en A4 x4"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f8fbfd",
          color: "#0f172a",
          padding: "64px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "650px" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#0369a1", marginBottom: 28 }}>Label2A4</div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.02 }}>
            Étiquettes PDF en A4 x4
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.35, color: "#475569", marginTop: 28 }}>
            Chronopost, Colissimo, Mondial Relay, Vinted et Leboncoin.
          </div>
        </div>
        <div
          style={{
            width: 330,
            height: 440,
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            padding: 22,
            border: "4px solid #bae6fd",
            borderRadius: 34,
            background: "#eff6ff",
          }}
        >
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              style={{
                width: 132,
                height: 184,
                display: "flex",
                flexDirection: "column",
                border: "2px solid #bae6fd",
                borderRadius: 20,
                background: "#ffffff",
                padding: 14,
              }}
            >
              <div style={{ width: 78, height: 10, borderRadius: 999, background: "#bae6fd" }} />
              <div style={{ width: "100%", height: 50, borderRadius: 12, background: "#0f172a", marginTop: 18 }} />
              <div style={{ width: 86, height: 8, borderRadius: 999, background: "#cbd5e1", marginTop: 18 }} />
              <div style={{ width: 64, height: 8, borderRadius: 999, background: "#cbd5e1", marginTop: 10 }} />
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  )
}
