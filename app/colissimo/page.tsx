import { SeoServicePage } from "@/components/seo-service-page"
import { getSeoMetadata, seoPages } from "@/lib/seo-pages"

const page = seoPages.colissimo

export const metadata = getSeoMetadata(page)

export default function ColissimoPage() {
  return <SeoServicePage page={page} />
}
