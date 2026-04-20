import { SeoServicePage } from "@/components/seo-service-page"
import { getSeoMetadata, seoPages } from "@/lib/seo-pages"

const page = seoPages.vinted

export const metadata = getSeoMetadata(page)

export default function VintedPage() {
  return <SeoServicePage page={page} />
}
