import { ResetPasswordPageContent } from "@/components/pages/public-pages"
import { buildPageMetadata } from "@/lib/page-metadata"

const locale = "fr" as const

export const metadata = buildPageMetadata({
  title: "Nouveau mot de passe",
  description: "Choisissez un nouveau mot de passe pour securiser votre compte Label2A4.",
  path: "/auth/reset-password",
  locale,
})

interface ResetPasswordPageProps {
  searchParams: Promise<{
    next?: string | string[]
    status?: string | string[]
  }>
}

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function getSafePath(value: string | undefined, fallback = "/compte") {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams
  const isFirstLogin = getSearchParamValue(params.status) === "first-login"
  const nextPath = getSafePath(getSearchParamValue(params.next))

  return <ResetPasswordPageContent initialIsFirstLogin={isFirstLogin} locale={locale} nextPath={nextPath} />
}
