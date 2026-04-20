import type { Metadata } from "next"
import { HomeTool } from "@/components/home-tool"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Étiquettes PDF en A4 x4 pour Chronopost, Colissimo et Mondial Relay",
  description:
    "Regroupez vos étiquettes PDF Chronopost, Colissimo et Mondial Relay sur des feuilles A4 x4 prêtes à imprimer.",
  alternates: {
    canonical: siteConfig.siteUrl,
  },
}

export default function HomePage() {
  return <HomeTool />
}
