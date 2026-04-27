import { AccountPageContent, getAccountStatusMessage } from "@/components/pages/public-pages"
import { buildPageMetadata } from "@/lib/page-metadata"

const locale = "fr" as const

export const metadata = buildPageMetadata({
  title: "Mon compte",
  description: "Retrouvez votre acces premium, votre quota, vos achats et votre facturation Label2A4 depuis votre espace compte.",
  path: "/compte",
  locale,
})

interface ComptePageProps {
  searchParams: Promise<{
    status?: string | string[]
  }>
}

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ComptePage({ searchParams }: ComptePageProps) {
  const params = await searchParams
  const statusMessage = getAccountStatusMessage(locale, getSearchParamValue(params.status))

  return <AccountPageContent locale={locale} statusMessage={statusMessage} />
}
