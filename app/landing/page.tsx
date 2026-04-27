import { LandingPageContent, getLandingPageContent } from "@/components/pages/landing-page-content"
import { buildPageMetadata } from "@/lib/page-metadata"

const locale = "fr" as const
const landing = getLandingPageContent(locale)

export const metadata = buildPageMetadata({
  title: landing.title,
  description: landing.description,
  path: "/landing",
  locale,
})

export default function LandingPage() {
  return <LandingPageContent locale={locale} />
}
