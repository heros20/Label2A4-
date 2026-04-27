import { PrivacyPageContent } from "@/components/pages/public-pages"
import { buildPageMetadata } from "@/lib/page-metadata"

const locale = "fr" as const

export const metadata = buildPageMetadata({
  title: "Confidentialite",
  description: "Politique de confidentialite de Label2A4 : donnees traitees, finalites, conservation et droits des utilisateurs.",
  path: "/confidentialite",
  locale,
})

export default function ConfidentialitePage() {
  return <PrivacyPageContent locale={locale} />
}
