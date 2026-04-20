import { SeoServicePage } from "@/components/seo-service-page"
import { getSeoMetadata, seoPages } from "@/lib/seo-pages"

const page = seoPages["mondial-relay"]

export const metadata = getSeoMetadata(page)

export default function MondialRelayPage() {
  return <SeoServicePage page={page} />
}
