import { CancellationPageContent } from "@/components/pages/public-pages"
import { buildPageMetadata } from "@/lib/page-metadata"

const locale = "fr" as const

export const metadata = buildPageMetadata({
  title: "Resiliation",
  description: "Resiliez votre abonnement Label2A4 depuis votre compte ou via le portail de facturation.",
  path: "/resiliation",
  locale,
})

export default function ResiliationPage() {
  return <CancellationPageContent locale={locale} />
}
