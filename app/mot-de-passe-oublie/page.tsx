import { ForgotPasswordPageContent } from "@/components/pages/public-pages"
import { buildPageMetadata } from "@/lib/page-metadata"

const locale = "fr" as const

export const metadata = buildPageMetadata({
  title: "Mot de passe oublie",
  description: "Recevez un email securise pour definir un nouveau mot de passe Label2A4.",
  path: "/mot-de-passe-oublie",
  locale,
})

export default function MotDePasseOubliePage() {
  return <ForgotPasswordPageContent locale={locale} />
}
