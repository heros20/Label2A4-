import { getSeoMetadata, getSeoPage } from "@/lib/seo-pages"
import { SeoServicePage } from "@/components/seo-service-page"

const locale = "fr" as const
const page = getSeoPage("rogner-etiquette", locale)

export const metadata = getSeoMetadata(page, locale)

export default function RognerEtiquettePage() {
  return <SeoServicePage page={page} locale={locale} />
}
