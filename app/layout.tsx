import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Label2A4",
  description: "Convertissez des PDF d etiquettes d expedition en planches A4 prêtes à imprimer.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
