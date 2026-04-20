import { SeoServicePage } from "@/components/seo-service-page"
import { getSeoMetadata, seoPages } from "@/lib/seo-pages"

const page = seoPages.chronopost

export const metadata = getSeoMetadata(page)

export default function ChronopostPage() {
  return <SeoServicePage page={page} />
}
