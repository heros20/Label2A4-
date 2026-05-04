import { getSeoMetadata, getSeoPage } from "@/lib/seo-pages"
import { SavingsSimulator } from "@/components/savings-simulator"
import { SeoServicePage } from "@/components/seo-service-page"

const locale = "fr" as const
const page = getSeoPage("economie-papier", locale)

export const metadata = getSeoMetadata(page, locale)

export default function EconomiePapierPage() {
  return (
    <SeoServicePage page={page} locale={locale}>
      <SavingsSimulator locale={locale} />
    </SeoServicePage>
  )
}
