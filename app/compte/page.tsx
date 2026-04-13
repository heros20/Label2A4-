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
      intro="Espace de gestion de votre accès Label2A4 sur ce navigateur."
    >
      <AnalyticsEventOnMount eventName="account_viewed" />
      <AccountPortal />
    </PageShell>
  )
}
