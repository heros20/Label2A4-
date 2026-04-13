import { PageShell } from "@/components/page-shell"
import { formatEuroFromCents, siteConfig } from "@/lib/site-config"

export const metadata = {
  title: "FAQ",
}

const faqItems = [
  {
    question: "Combien de planches A4 sont offertes par jour ?",
    answer: `La formule gratuite permet jusqu’à ${siteConfig.pricing.freeDailyA4Sheets} planche(s) A4 exportée(s) par jour.`,
  },
  {
    question: "Comment passer en illimité ?",
    answer: `Vous pouvez acheter un pass 24h à ${formatEuroFromCents(siteConfig.pricing.dayPassPriceCents)} ou souscrire un abonnement mensuel/annuel depuis la page Tarifs.`,
  },
  {
    question: "Comment résilier ?",
    answer: "La résiliation s’effectue en ligne depuis la page Résiliation. Si le portail n’est pas disponible, le support prend le relais.",
  },
  {
    question: "Que faire si mon PDF ne se génère pas ?",
    answer: `Vérifiez d’abord le format et la lisibilité du PDF, puis contactez ${siteConfig.supportEmail} avec le transporteur concerné et une capture d’écran du message d’erreur.`,
  },
  {
    question: "Le site conserve-t-il mes fichiers PDF ?",
    answer: siteConfig.dataHandling.keepUploadedPdfs
      ? "Les PDF sont conservés selon la politique de confidentialité publiée sur le site."
      : "Non. Les PDF sont traités uniquement le temps de produire le résultat demandé puis ne sont pas conservés par le site.",
  },
] as const

export default function FaqPage() {
  return (
    <PageShell title="FAQ" intro="Questions fréquentes pour les utilisateurs gratuits et premium.">
      {faqItems.map((item) => (
        <section key={item.question} className="rounded-[24px] border border-slate-200/80 bg-white/70 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">{item.question}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
        </section>
      ))}
    </PageShell>
  )
}
