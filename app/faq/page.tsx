import { FaqPageContent } from "@/components/pages/public-pages"
import { buildPageMetadata } from "@/lib/page-metadata"

const locale = "fr" as const

export const metadata = buildPageMetadata({
  title: "FAQ",
  description: "Questions frequentes sur Label2A4, les quotas gratuits, les offres premium et la preparation de PDF d'etiquettes transporteurs.",
  path: "/faq",
  locale,
})

export default function FaqPage() {
  return <FaqPageContent locale={locale} />
}
