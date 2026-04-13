import Link from "next/link"
import { BillingPortalButton } from "@/components/billing-portal-button"
import { PageShell } from "@/components/page-shell"
import { siteConfig } from "@/lib/site-config"

export const metadata = {
  title: "Résiliation",
}

export default function ResiliationPage() {
  return (
    <PageShell
      title="Résiliation"
      intro="La résiliation doit rester accessible en ligne si l’abonnement a été souscrit en ligne."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">Résilier en ligne</h2>
        <p className="text-sm leading-6 text-slate-600">
          La gestion complète de l’abonnement est disponible dans{" "}
          <Link href="/compte" className="text-sky-800 hover:underline">
            Mon compte
          </Link>
          . Vous y retrouverez le bouton d’accès au portail Stripe.
        </p>
        <BillingPortalButton
          label="Ouvrir le portail de résiliation"
          className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">Si le portail n’est pas disponible</h2>
        <p>
          Contactez{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className="text-sky-800 hover:underline">
            {siteConfig.supportEmail}
          </a>{" "}
          pour demander la résiliation. Indiquez l’email de facturation et, si possible, la date de souscription.
        </p>
      </section>
    </PageShell>
  )
}
