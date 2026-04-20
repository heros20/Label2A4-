import { SeoServicePage } from "@/components/seo-service-page"
import { getSeoMetadata, seoPages } from "@/lib/seo-pages"

const page = seoPages.entreprises

export const metadata = getSeoMetadata(page)

export default function EntreprisesPage() {
  return <SeoServicePage page={page} />
}
