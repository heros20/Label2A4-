import Link from "next/link"
import { AnalyticsEventOnMount } from "@/components/analytics-event-on-mount"
import { CheckoutButton } from "@/components/checkout-button"
import { PageShell } from "@/components/page-shell"
import { formatEuroFromCents, siteConfig } from "@/lib/site-config"

export const metadata = {
  title: "Tarifs",
}

const cardClass =
  "rounded-[28px] border border-slate-200/80 bg-white/78 p-6 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.3)]"

export default function TarifsPage() {
  const annualMonthlyEquivalent = formatEuroFromCents(
    Math.round(siteConfig.pricing.annualPriceCents / 12),
  )

  return (
    <PageShell
      title="Tarifs"
      intro="Gratuit pour tester, pass 24h pour les besoins ponctuels, abonnement pour les vendeurs réguliers."
    >
      <AnalyticsEventOnMount eventName="pricing_viewed" />
      <div className="grid gap-4 xl:grid-cols-4">
        <section className={cardClass}>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Gratuit</div>
          <div className="mt-4 text-3xl font-semibold text-slate-950">0 €</div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Jusqu&apos;à {siteConfig.pricing.freeDailyA4Sheets} planche(s) A4 exportée(s) par jour. Idéal pour tester
            le service ou gérer un volume occasionnel.
          </p>
        </section>

        <section className={cardClass}>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Pass 24h</div>
          <div className="mt-4 text-3xl font-semibold text-slate-950">
            {formatEuroFromCents(siteConfig.pricing.dayPassPriceCents)}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Accès illimité pendant 24 heures, sans publicité. Pratique pour les gros lots ponctuels.
          </p>
          <div className="mt-5">
            <CheckoutButton
              planId="day-pass"
              label="Acheter le pass 24h"
              className="w-full bg-slate-950 text-white hover:bg-slate-800"
            />
          </div>
        </section>

        <section className={cardClass}>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">Mensuel</div>
          <div className="mt-4 text-3xl font-semibold text-slate-950">
            {formatEuroFromCents(siteConfig.pricing.monthlyPriceCents)}
            <span className="text-base font-medium text-slate-500"> / mois</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Abonnement illimité, sans publicité et avec accès à l’espace client. Adapté si vous expédiez toute
            l&apos;année.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Espace client : état du plan, accès au portail Stripe, factures et résiliation.
          </p>
          <div className="mt-5">
            <CheckoutButton
              planId="monthly"
              label="Choisir l’offre mensuelle"
              className="w-full bg-[linear-gradient(135deg,#0f172a,#0369a1)] text-white hover:brightness-110"
            />
          </div>
        </section>

        <section className={cardClass}>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Annuel</div>
          <div className="mt-4 text-3xl font-semibold text-slate-950">
            {formatEuroFromCents(siteConfig.pricing.annualPriceCents)}
            <span className="text-base font-medium text-slate-500"> / an</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Version illimitée sur 12 mois, sans publicité, avec accès à l’espace client.
          </p>
          <p className="mt-3 text-sm font-medium text-slate-700">
            Revient à environ {annualMonthlyEquivalent} / mois.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Espace client : état du plan, accès au portail Stripe, factures et résiliation.
          </p>
          <div className="mt-5">
            <CheckoutButton
              planId="annual"
              label="Choisir l’offre annuelle"
              className="w-full bg-[linear-gradient(135deg,#064e3b,#10b981)] text-white hover:brightness-110"
            />
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">Avant achat</h2>
        <p>
          Les conditions de renouvellement, de résiliation, de remboursement et de droit de rétractation sont détaillées
          dans les{" "}
          <Link href="/cgv" className="text-sky-800 hover:underline">
            CGV
          </Link>
          .
        </p>
        <p>
          L’espace client sera disponible après achat depuis{" "}
          <Link href="/compte" className="text-sky-800 hover:underline">
            Mon compte
          </Link>
          .
        </p>
      </section>
    </PageShell>
  )
}
