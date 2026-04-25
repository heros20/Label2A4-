import { ContactForm } from "@/components/contact-form"
import { PageShell } from "@/components/page-shell"
import { siteConfig } from "@/lib/site-config"

export const metadata = {
  title: "Support",
}

export default function ContactPage() {
  return (
    <PageShell
      title="Support"
      intro="Contactez le support pour toute question sur le service, un problème de génération PDF, une étiquette non reconnue ou une demande liée à votre abonnement."
    >
      <section className="rounded-[24px] border border-emerald-200/80 bg-emerald-50/80 p-5 text-sm leading-6 text-emerald-950 shadow-[0_18px_40px_-34px_rgba(34,197,94,0.18)]">
        <h2 className="text-xl font-semibold text-slate-950">Votre étiquette n&apos;est pas encore prise en charge ?</h2>
        <p className="mt-3">
          Envoyez-nous le PDF source via le formulaire ci-dessous avec une pièce jointe. Cela nous permet de vérifier le
          format exact et de voir si un profil ou une variante adaptée peut être ajouté.
        </p>
      </section>

      <ContactForm supportEmail={siteConfig.supportEmail} />

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
