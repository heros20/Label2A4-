import { PaymentSuccessPageContent } from "@/components/pages/public-pages"
import { buildPageMetadata } from "@/lib/page-metadata"

const locale = "fr" as const

export const metadata = buildPageMetadata({
  title: "Paiement confirme",
  description: "Votre paiement Label2A4 a ete confirme. Retrouvez votre acces premium depuis votre compte.",
  path: "/paiement/succes",
  locale,
})

export default function PaiementSuccesPage() {
  return <PaymentSuccessPageContent locale={locale} />
}
