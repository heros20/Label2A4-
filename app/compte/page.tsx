import { AnalyticsEventOnMount } from "@/components/analytics-event-on-mount"
import { AccountPortal } from "@/components/account-portal"
import { PageShell } from "@/components/page-shell"

export const metadata = {
  title: "Mon compte",
}

export default function ComptePage() {
  return (
    <PageShell
      title="Mon compte"
      intro="Espace de gestion de votre compte Label2A4, de vos accès premium et de votre facturation."
    >
      <AnalyticsEventOnMount eventName="account_viewed" />
      <AccountPortal />
    </PageShell>
  )
}
