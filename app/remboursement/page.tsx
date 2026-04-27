import { RefundPageContent } from "@/components/pages/public-pages"
import { buildPageMetadata } from "@/lib/page-metadata"

const locale = "fr" as const

export const metadata = buildPageMetadata({
  title: "Remboursement",
  description: "Procedure de remboursement Label2A4 : comment envoyer une demande et quelles informations fournir.",
  path: "/remboursement",
  locale,
})

export default function RemboursementPage() {
  return <RefundPageContent locale={locale} />
}
