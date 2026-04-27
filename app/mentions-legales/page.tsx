import { LegalNoticePageContent } from "@/components/pages/public-pages"
import { buildPageMetadata } from "@/lib/page-metadata"

const locale = "fr" as const

export const metadata = buildPageMetadata({
  title: "Mentions legales",
  description: "Mentions legales de Label2A4 : editeur du site, hebergement, mediation et informations juridiques.",
  path: "/mentions-legales",
  locale,
})

export default function MentionsLegalesPage() {
  return <LegalNoticePageContent locale={locale} />
}
