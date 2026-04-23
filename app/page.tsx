import type { Metadata } from "next"
import { HomeTool } from "@/components/home-tool"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Fini le gaspillage : 4 étiquettes colis sur une feuille A4",
  description:
    "Imprimez jusqu'à 4 étiquettes colis sur une seule feuille A4. Optimisez vos PDF Chronopost, Colissimo, Mondial Relay et Happy Post pour économiser papier et encre.",
  alternates: {
    canonical: siteConfig.siteUrl,
  },
  openGraph: {
    title: siteConfig.primarySlogan,
    description: siteConfig.socialTagline,
    url: siteConfig.siteUrl,
  },
  twitter: {
    title: siteConfig.primarySlogan,
    description: siteConfig.socialTagline,
  },
}

export default function HomePage() {
  return <HomeTool />
}
