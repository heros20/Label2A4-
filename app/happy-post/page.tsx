import { SeoServicePage } from "@/components/seo-service-page"
import { getSeoMetadata, seoPages } from "@/lib/seo-pages"

const page = seoPages["happy-post"]

export const metadata = getSeoMetadata(page)

export default function HappyPostPage() {
  return <SeoServicePage page={page} />
}
