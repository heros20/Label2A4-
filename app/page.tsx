import type { Metadata } from "next"
import { HomeTool } from "@/components/home-tool"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Étiquettes PDF en A4 x4 pour vos transporteurs",
  description:
    "Regroupez vos étiquettes PDF Chronopost, Colissimo, Mondial Relay et Happy Post sur des feuilles A4 x4 prêtes à imprimer.",
  alternates: {
    canonical: siteConfig.siteUrl,
  },
}

export default function HomePage() {
  return <HomeTool />
}
