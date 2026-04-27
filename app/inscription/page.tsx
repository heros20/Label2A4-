import { InscriptionPageContent } from "@/components/pages/public-pages"
import { buildPageMetadata } from "@/lib/page-metadata"

const locale = "fr" as const

export const metadata = buildPageMetadata({
  title: "Creer un compte",
  description: "Creez votre compte Label2A4 pour retrouver vos achats, vos quotas et vos factures.",
  path: "/inscription",
  locale,
})

export default function InscriptionPage() {
  return <InscriptionPageContent locale={locale} />
}
