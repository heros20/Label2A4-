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
      intro="Retrouvez vos accès premium, votre quota et votre facturation après connexion avec email et mot de passe."
    >
      <AnalyticsEventOnMount eventName="account_viewed" />
      <AccountPortal />
    </PageShell>
  )
}
