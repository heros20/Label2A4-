import { AnalyticsEventOnMount } from "@/components/analytics-event-on-mount"
import Link from "next/link"
import { PageShell } from "@/components/page-shell"

export const metadata = {
  title: "Paiement confirmé",
}

export default function PaiementSuccesPage() {
  return (
    <PageShell
      title="Paiement confirmé"
      intro="Votre accès premium a été activé pour ce navigateur. Vous pouvez revenir à l’outil ou ouvrir votre espace client."
    >
      <AnalyticsEventOnMount eventName="payment_success_page_view" />
      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          Revenir à l’outil
        </Link>
        <Link
          href="/compte"
          className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
        >
          Ouvrir mon compte
        </Link>
      </div>
    </PageShell>
  )
}
