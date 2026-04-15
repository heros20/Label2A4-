import { PageShell } from "@/components/page-shell"
import { siteConfig } from "@/lib/site-config"

export const metadata = {
  title: "Cookies",
}

export default function CookiesPage() {
  return (
    <PageShell
      title="Politique cookies"
      intro=""
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">Cookies strictement nécessaires</h2>
        <p>
          Le site utilise des cookies techniques pour mémoriser votre identifiant anonyme et votre état d&apos;accès
          premium. Le quota gratuit peut aussi s&apos;appuyer sur un stockage serveur minimal afin d&apos;éviter qu&apos;un
          simple vidage du cache ou des cookies ne réinitialise la limite quotidienne.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">Mesure d&apos;audience et conversion</h2>
        <p>
          Le site peut activer Vercel Analytics pour mesurer les visites, les pages vues et quelques événements métier
          comme l&apos;ouverture du checkout, la validation du paiement ou l&apos;ouverture du portail de facturation.
        </p>
        <p>
          Ces traceurs facultatifs ne sont activés qu&apos;après votre consentement. En cas de refus, la mesure
          d&apos;audience n&apos;est pas chargée et les événements de conversion ne sont pas envoyés.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">État actuel</h2>
        <p><strong>Publicité activée :</strong> {siteConfig.compliance.adsEnabled ? "oui" : "non"}</p>
        <p>
          <strong>Traceurs facultatifs activables :</strong>{" "}
          {siteConfig.compliance.optionalTrackersEnabled ? "oui" : "non"}
        </p>
      </section>
    </PageShell>
  )
}
