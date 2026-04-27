import { PricingPageContent } from "@/components/pages/public-pages"
import { buildPageMetadata } from "@/lib/page-metadata"

const locale = "fr" as const

export const metadata = buildPageMetadata({
  title: "Tarifs",
  description: "Comparez la formule gratuite, le pass 24h et les abonnements Label2A4 pour exporter vos etiquettes PDF sur feuilles A4.",
  path: "/tarifs",
  locale,
})

export default function TarifsPage() {
  return <PricingPageContent locale={locale} />
}
