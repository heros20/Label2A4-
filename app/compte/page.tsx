import { AnalyticsEventOnMount } from "@/components/analytics-event-on-mount"
import { AccountPortal } from "@/components/account-portal"
import { PageShell } from "@/components/page-shell"

export const metadata = {
  title: "Mon compte",
}

interface ComptePageProps {
  searchParams: Promise<{
    status?: string | string[]
  }>
}

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function getAccountStatusMessage(value: string | undefined) {
  if (value === "account-confirmed") {
    return "Votre compte est confirmé. Vous êtes maintenant connecté à votre espace Label2A4."
  }

  if (value === "password-created") {
    return "Votre mot de passe est enregistré. Votre compte est prêt."
  }

  return ""
}

export default async function ComptePage({ searchParams }: ComptePageProps) {
  const params = await searchParams
  const statusMessage = getAccountStatusMessage(getSearchParamValue(params.status))

  return (
    <PageShell
      title="Mon compte"
      intro="Retrouvez vos accès premium, votre quota et votre facturation après connexion avec email et mot de passe."
    >
      <AnalyticsEventOnMount eventName="account_viewed" />
      {statusMessage && (
        <section className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-900">
          {statusMessage}
        </section>
      )}
      <AccountPortal />
    </PageShell>
  )
}
