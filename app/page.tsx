import { HomeTool } from "@/components/home-tool"
import { buildPageMetadata } from "@/lib/page-metadata"
import { getSiteText } from "@/lib/site-copy"

const locale = "fr" as const
const title = "Etiquettes PDF en A4 x4 pour vos transporteurs"

export const metadata = buildPageMetadata({
  title,
  description: getSiteText(locale).description,
  path: "/",
  locale,
})

export default function HomePage() {
  return <HomeTool locale={locale} />
}
