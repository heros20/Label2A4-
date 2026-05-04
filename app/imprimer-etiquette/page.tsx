import { getSeoMetadata, getSeoPage } from "@/lib/seo-pages"
import { SeoServicePage } from "@/components/seo-service-page"

const locale = "fr" as const
const page = getSeoPage("imprimer-etiquette", locale)

export const metadata = getSeoMetadata(page, locale)

export default function ImprimerEtiquettePage() {
  return <SeoServicePage page={page} locale={locale} />
}
