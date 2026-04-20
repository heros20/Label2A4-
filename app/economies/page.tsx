import { SavingsSimulator } from "@/components/savings-simulator"
import { SeoServicePage } from "@/components/seo-service-page"
import { getSeoMetadata, seoPages } from "@/lib/seo-pages"

const page = seoPages.economies

export const metadata = getSeoMetadata(page)

export default function EconomiesPage() {
  return (
    <SeoServicePage page={page}>
      <SavingsSimulator />
    </SeoServicePage>
  )
}
