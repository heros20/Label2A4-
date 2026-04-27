import { SavingsSimulator } from "@/components/savings-simulator"
import { SeoServicePage } from "@/components/seo-service-page"
import { getSeoMetadata, getSeoPage } from "@/lib/seo-pages"

const locale = "fr" as const
const page = getSeoPage("economies", locale)

export const metadata = getSeoMetadata(page, locale)

export default function EconomiesPage() {
  return (
    <SeoServicePage page={page} locale={locale}>
      <SavingsSimulator locale={locale} />
    </SeoServicePage>
  )
}
