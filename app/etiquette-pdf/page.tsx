import { getSeoMetadata, getSeoPage } from "@/lib/seo-pages"
import { SeoServicePage } from "@/components/seo-service-page"

const locale = "fr" as const
const page = getSeoPage("etiquette-pdf", locale)

export const metadata = getSeoMetadata(page, locale)

export default function EtiquettePdfPage() {
  return <SeoServicePage page={page} locale={locale} />
}
