import { LegalWarning } from "@/components/legal-warning"
import { PageShell } from "@/components/page-shell"
import { siteConfig } from "@/lib/site-config"

export const metadata = {
  title: "Confidentialité",
}

export default function ConfidentialitePage() {
  return (
    <PageShell
      title="Politique de confidentialité"
      intro="Cette page décrit les données traitées par le service, leur finalité, leur durée de conservation et l'usage de la mesure d'audience."
    >
      <LegalWarning />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">1. Données traitées</h2>
        <p>
          Le site traite les fichiers PDF déposés pour produire le résultat demandé, les identifiants techniques
          nécessaires au quota gratuit, les informations de paiement transmises par Stripe et les données minimales de
          support si vous nous contactez.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">2. Finalités</h2>
        <p>
          Ces traitements servent à fournir le service, appliquer les limites gratuites, gérer les accès premium,
          répondre aux demandes de support, sécuriser la plateforme et journaliser les événements utiles au diagnostic
          et à la prévention d&apos;abus.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">3. Base légale</h2>
        <p>
          Les traitements strictement nécessaires reposent sur l&apos;exécution du service demandé. Les paiements sont
          gérés par Stripe. La mesure d&apos;audience et les événements de conversion sont activés uniquement si vous
          acceptez les traceurs facultatifs via le bandeau prévu à cet effet.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">4. Durées de conservation</h2>
        <p>
          Les fichiers PDF sont traités uniquement le temps nécessaire à la génération du résultat puis ne sont pas
          conservés par le site.
        </p>
        <p>
          Les cookies techniques et informations d&apos;accès sont conservés pendant la durée strictement nécessaire au
          fonctionnement du service. Les journaux techniques liés aux erreurs, au quota et à la prévention d&apos;abus
          sont conservés pendant {siteConfig.dataHandling.technicalLogRetentionDays} jours.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">5. Destinataires</h2>
        <p>
          Les données nécessaires au paiement sont traitées par Stripe. L&apos;hébergement est assuré par {siteConfig.host.name}.
          La mesure d&apos;audience est fournie via Vercel Analytics. Aucun réseau publicitaire n&apos;est utilisé et aucun PDF
          n&apos;est revendu, cédé ou stocké à des fins marketing.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">6. Vos droits</h2>
        <p>
          Vous pouvez exercer vos droits d&apos;accès, rectification, effacement, opposition et limitation à l&apos;adresse{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className="text-sky-800 hover:underline">
            {siteConfig.supportEmail}
          </a>
          .
        </p>
      </section>
    </PageShell>
  )
}
