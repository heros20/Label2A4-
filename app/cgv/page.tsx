import { TermsPageContent } from "@/components/pages/public-pages"
import { buildPageMetadata } from "@/lib/page-metadata"

const locale = "fr" as const

export const metadata = buildPageMetadata({
  title: "CGV",
  description: "Conditions generales de vente de Label2A4 : offres, paiement, resiliation, retractation et remboursement.",
  path: "/cgv",
  locale,
})

export default function CgvPage() {
  return <TermsPageContent locale={locale} />
}
