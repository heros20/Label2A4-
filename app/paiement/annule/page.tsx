import { PaymentCancelledPageContent } from "@/components/pages/public-pages"
import { buildPageMetadata } from "@/lib/page-metadata"

const locale = "fr" as const

export const metadata = buildPageMetadata({
  title: "Paiement annule",
  description: "Le paiement premium Label2A4 n'a pas ete finalise. Vous pouvez reprendre votre utilisation gratuite ou relancer l'achat.",
  path: "/paiement/annule",
  locale,
})

export default function PaiementAnnulePage() {
  return <PaymentCancelledPageContent locale={locale} />
}
