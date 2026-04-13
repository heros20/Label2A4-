import { PageShell } from "@/components/page-shell"
import { siteConfig } from "@/lib/site-config"

export const metadata = {
  title: "Support",
}

export default function ContactPage() {
  return (
    <PageShell
      title="Support"
      intro="Contactez le support pour toute question sur le service, un problème de génération PDF ou une demande liée à votre abonnement."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">Email de support</h2>
        <p>
          <a href={`mailto:${siteConfig.supportEmail}`} className="text-sky-800 hover:underline">
            {siteConfig.supportEmail}
          </a>
        </p>
        <p>{siteConfig.supportResponseDelay}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">Informations utiles en cas de bug</h2>
        <p>Merci d’indiquer si possible :</p>
        <ul className="list-disc pl-6 text-sm leading-7 text-slate-600">
          <li>le transporteur concerné</li>
          <li>le nombre de planches attendues</li>
          <li>une capture d’écran du message d’erreur</li>
          <li>la date et l’heure de l’incident</li>
        </ul>
      </section>
    </PageShell>
  )
}
