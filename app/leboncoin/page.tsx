import { SeoServicePage } from "@/components/seo-service-page"
import { getSeoMetadata, seoPages } from "@/lib/seo-pages"

const page = seoPages.leboncoin

export const metadata = getSeoMetadata(page)

export default function LeboncoinPage() {
  return <SeoServicePage page={page} />
}
