import { AnalyticsEventOnMount } from "@/components/analytics-event-on-mount"
import Link from "next/link"
import { PageShell } from "@/components/page-shell"

export const metadata = {
  title: "Paiement annulé",
}

export default function PaiementAnnulePage() {
  return (
    <PageShell
      title="Paiement annulé"
      intro="Le paiement n’a pas été finalisé. Vous pouvez reprendre votre utilisation gratuite ou relancer l’achat depuis la page Tarifs."
    >
      <AnalyticsEventOnMount eventName="checkout_cancelled_page_view" />
      <div className="flex flex-wrap gap-3">
        <Link
          href="/tarifs"
          className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          Retour aux tarifs
        </Link>
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
        >
          Retour à l’outil
        </Link>
      </div>
    </PageShell>
  )
}
