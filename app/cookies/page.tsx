import { CookiesPageContent } from "@/components/pages/public-pages"
import { buildPageMetadata } from "@/lib/page-metadata"

const locale = "fr" as const

export const metadata = buildPageMetadata({
  title: "Cookies",
  description: "Informations sur les cookies techniques utilises par Label2A4 pour les quotas, l'acces et le fonctionnement du service.",
  path: "/cookies",
  locale,
})

export default function CookiesPage() {
  return <CookiesPageContent locale={locale} />
}
