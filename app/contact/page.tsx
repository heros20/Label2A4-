import { ContactPageContent } from "@/components/pages/public-pages"
import { buildPageMetadata } from "@/lib/page-metadata"

const locale = "fr" as const

export const metadata = buildPageMetadata({
  title: "Support",
  description: "Contactez le support Label2A4 pour une etiquette non prise en charge, un probleme PDF ou une question sur votre abonnement.",
  path: "/contact",
  locale,
})

export default function ContactPage() {
  return <ContactPageContent locale={locale} />
}
