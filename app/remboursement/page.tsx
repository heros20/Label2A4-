import { PageShell } from "@/components/page-shell"
import { siteConfig } from "@/lib/site-config"

export const metadata = {
  title: "Remboursement",
}

export default function RemboursementPage() {
  return (
    <PageShell
      title="Procédure de remboursement"
      intro=""
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">Comment demander un remboursement ?</h2>
        <p>
          Envoyez votre demande à{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className="text-sky-800 hover:underline">
            {siteConfig.supportEmail}
          </a>{" "}
          en indiquant l’email utilisé lors du paiement, la date de transaction et le motif de la demande.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">Délais de traitement</h2>
        <p>
          Les demandes sont étudiées au cas par cas. En cas d’acceptation, le remboursement est émis sur le moyen de
          paiement initial.
        </p>
      </section>
    </PageShell>
  )
}
