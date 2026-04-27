import { ConnexionPageContent } from "@/components/pages/public-pages"
import { buildPageMetadata } from "@/lib/page-metadata"

const locale = "fr" as const

export const metadata = buildPageMetadata({
  title: "Connexion",
  description: "Connectez-vous a votre compte Label2A4 pour retrouver vos exports premium, votre quota et votre facturation.",
  path: "/connexion",
  locale,
})

export default function ConnexionPage() {
  return <ConnexionPageContent locale={locale} />
}
