import Link from "next/link"
import { LegalWarning } from "@/components/legal-warning"
import { PageShell } from "@/components/page-shell"
import { formatEuroFromCents, siteConfig } from "@/lib/site-config"

export const metadata = {
  title: "CGV",
}

export default function CgvPage() {
  return (
    <PageShell
      title="Conditions générales de vente"
      intro=""
    >
      <LegalWarning />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">1. Objet</h2>
        <p>
          Les présentes CGV définissent les conditions de fourniture du service {siteConfig.siteName}, outil de
          préparation d’étiquettes PDF sur planches A4.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">2. Offres et prix TTC</h2>
        <p><strong>Gratuit :</strong> jusqu’à {siteConfig.pricing.freeDailyA4Sheets} planche(s) A4 exportée(s) par jour.</p>
        <p><strong>Pass 24h :</strong> {formatEuroFromCents(siteConfig.pricing.dayPassPriceCents)} TTC.</p>
        <p><strong>Abonnement mensuel :</strong> {formatEuroFromCents(siteConfig.pricing.monthlyPriceCents)} TTC / mois.</p>
        <p><strong>Abonnement annuel :</strong> {formatEuroFromCents(siteConfig.pricing.annualPriceCents)} TTC / an.</p>
        <p>
          Les offres premium incluent un accès sans publicité, des exports illimités pendant la durée de validité de
          l’offre et l’accès aux fonctionnalités premium publiées sur le site.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">3. Paiement, renouvellement et facturation</h2>
        <p>
          Les paiements sont sécurisés via Stripe. Les abonnements se renouvellent automatiquement à chaque échéance
          jusqu’à résiliation. Les reçus et factures sont émis par le prestataire de paiement selon votre configuration
          Stripe.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">4. Résiliation</h2>
        <p>
          Vous pouvez résilier votre abonnement en ligne à tout moment depuis la page{" "}
          <Link href="/compte" className="text-sky-800 hover:underline">
            Mon compte
          </Link>
          . L’accès premium reste actif jusqu’à la fin de la période déjà payée, sauf mention contraire.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">5. Droit de rétractation</h2>
        <p>
          En cas d’achat par un consommateur, le droit de rétractation de 14 jours s’applique en principe. Toutefois,
          si l’utilisateur demande l’activation immédiate du service premium et renonce expressément à son droit de
          rétractation, l’exécution démarre sans attendre l’expiration de ce délai.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">6. Remboursement</h2>
        <p>
          Les demandes de remboursement sont traitées au cas par cas à l’adresse{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className="text-sky-800 hover:underline">
            {siteConfig.supportEmail}
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">7. Support</h2>
        <p>
          Le support est joignable à{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className="text-sky-800 hover:underline">
            {siteConfig.supportEmail}
          </a>
          . {siteConfig.supportResponseDelay}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">8. Médiation de la consommation</h2>
        <p>
          En cas de litige non résolu avec le support, le client consommateur peut recourir au médiateur suivant :
          {` ${siteConfig.mediator.name}.`}
        </p>
        <p><strong>Adresse :</strong> {siteConfig.mediator.address}</p>
        <p><strong>Site :</strong> {siteConfig.mediator.website}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">9. Limitation de responsabilité</h2>
        <p>
          Le service est fourni en l’état. L’éditeur s’engage à apporter un soin raisonnable au traitement des PDF, sans
          garantir l’absence absolue d’erreurs sur tous les documents ou tous les transporteurs. L’utilisateur conserve
          la responsabilité de vérifier ses planches avant impression et expédition.
        </p>
      </section>
    </PageShell>
  )
}
