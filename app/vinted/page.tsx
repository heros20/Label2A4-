import { SeoServicePage } from "@/components/seo-service-page"
import { getSeoMetadata, getSeoPage } from "@/lib/seo-pages"

const locale = "fr" as const
const page = getSeoPage("vinted", locale)

export const metadata = getSeoMetadata(page, locale)

export default function VintedPage() {
  return <SeoServicePage page={page} locale={locale} />
}
