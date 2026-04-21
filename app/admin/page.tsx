import { AdminLoginForm } from "@/components/admin-login-form"
import { AdminLogoutButton } from "@/components/admin-logout-button"
import { PageShell } from "@/components/page-shell"
import { isAdminAuthenticated, isAdminDashboardConfigured } from "@/lib/admin-auth"
import { getAdminDashboardData } from "@/lib/admin-dashboard"

export const metadata = {
  title: "Admin",
}

export const dynamic = "force-dynamic"

const cardClass =
  "rounded-[24px] border border-slate-200/80 bg-white/78 p-5 shadow-[0_22px_50px_-42px_rgba(15,23,42,0.24)]"

const vercelProjectDashboardUrl = "https://vercel.com/herosqwerty-1719s-projects/label2a4"

const lastUpdateDoneItems = [
  "Paiement Stripe modernisé avec Checkout, SDK Stripe à jour, cartes, PayPal, Apple Pay et Google Pay via moyens dynamiques.",
  "Codes promo serveur ajoutés : validation backend, réservation anti-double usage, réductions fixes/pourcentage et essai gratuit 7 jours.",
  "Quota gratuit renforcé : invité signé, compte gratuit, premium, garde anti-abus serveur et rate limiting.",
  "Compteur écologique ajouté : feuilles économisées, étiquettes optimisées, compteur individuel et global plateforme.",
  "Footer crédibilisé avec le lien créateur Heros20 et le logo demandé.",
  "Documentation technique ajoutée dans docs/payment-promo-quota-architecture.md.",
] as const

const ownerTodoItems = [
  "Appliquer dans Supabase les fichiers SQL : supabase/quota.sql, supabase/billing.sql, supabase/promo_codes.sql et supabase/impact.sql.",
  "Activer dans Stripe Dashboard les moyens de paiement souhaités : carte, PayPal, Apple Pay et Google Pay.",
  "Enregistrer les domaines de paiement Stripe pour Apple Pay / Google Pay en test et en production.",
  "Vérifier les variables d'environnement Stripe, Supabase, quota et prix dans Vercel.",
  "Tester un achat pass 24h, un abonnement mensuel, un abonnement annuel, un code WELCOME20, un code TRIAL7 et un quota atteint.",
  "Créer ou ajuster les codes influenceurs dans la table promo_codes avant campagne.",
] as const

export default async function AdminPage() {
  const isConfigured = isAdminDashboardConfigured()
  const isAuthenticated = isConfigured ? await isAdminAuthenticated() : false

  if (!isConfigured) {
    return (
      <PageShell title="Admin" intro="Le dashboard admin nécessite un token dédié côté serveur.">
        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-slate-950">Configuration requise</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Ajoutez la variable d&apos;environnement <code>ADMIN_DASHBOARD_TOKEN</code> pour activer la connexion à ce
            dashboard.
          </p>
        </section>
      </PageShell>
    )
  }

  if (!isAuthenticated) {
    return (
      <PageShell
        title="Admin"
        intro=""
      >
        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-slate-950">Connexion admin</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Cette page n&apos;est pas publique.
          </p>
          <div className="mt-5 max-w-md">
            <AdminLoginForm />
          </div>
        </section>
      </PageShell>
    )
  }

  const dashboard = await getAdminDashboardData()
  const stripeDashboardBaseUrl = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_")
    ? "https://dashboard.stripe.com/test"
    : "https://dashboard.stripe.com"

  return (
    <PageShell
      title="Dashboard admin"
      intro="Vue rapide du trafic mesuré, des checkouts, des paiements et des abonnements actifs."
    >
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          Source de vérité trafic: Vercel Analytics. Source de vérité revenu et abonnements: Stripe.
        </div>
        <AdminLogoutButton />
      </section>

      <nav
        aria-label="Onglets admin"
        className="flex flex-wrap gap-2 rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-2"
      >
        <a
          href="#vue-generale"
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_-24px_rgba(15,23,42,0.6)]"
        >
          Vue générale
        </a>
        <a
          href="#derniere-mise-a-jour"
          className="rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:text-sky-800"
        >
          Dernière mise à jour
        </a>
      </nav>

      <section id="derniere-mise-a-jour" className={cardClass}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">Dernière mise à jour</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Paiement, promos, écologie, crédibilité et quota
            </h2>
          </div>
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            Patch poussé sur master
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[20px] border border-slate-200/80 bg-white/80 p-4">
            <h3 className="font-semibold text-slate-950">Ce qui a été ajouté</h3>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {lastUpdateDoneItems.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] border border-amber-200/80 bg-amber-50/70 p-4">
            <h3 className="font-semibold text-amber-950">Ce que vous devez faire</h3>
            <div className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
              {ownerTodoItems.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[20px] border border-slate-200/80 bg-slate-50/80 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-slate-950">Codes promo et utilité</h3>
            <div className="text-xs font-medium text-slate-500">
              {dashboard.promoCodesConfigured
                ? "Codes lus depuis Supabase"
                : "Aperçu des codes seed à créer via supabase/promo_codes.sql"}
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {dashboard.promoCodes.map((promo) => (
              <div
                key={promo.code}
                className="rounded-[18px] border border-slate-200/80 bg-white p-4 text-sm text-slate-700"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-mono text-sm font-semibold text-slate-950">{promo.code}</div>
                    <div className="mt-1 font-medium text-slate-900">{promo.label}</div>
                  </div>
                  <div
                    className={
                      promo.active
                        ? "w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                        : "w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500"
                    }
                  >
                    {promo.active ? "actif" : "à configurer"}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <p>
                    <strong>Avantage :</strong> {promo.discountLabel}
                  </p>
                  <p>
                    <strong>Plans :</strong> {promo.plansLabel}
                  </p>
                  <p>
                    <strong>Limites :</strong> {promo.limitsLabel}
                  </p>
                  <p>
                    <strong>Expiration :</strong> {promo.expiresAt ?? "aucune"}
                  </p>
                </div>
                <p className="mt-3 text-slate-600">
                  <strong>Utilité :</strong> {promo.utility}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div id="vue-generale" className="grid gap-4 xl:grid-cols-4">
        <section className={cardClass}>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">Abonnements actifs</div>
          <div className="mt-3 text-3xl font-semibold text-slate-950">{dashboard.subscriptionsActive}</div>
          <p className="mt-2 text-sm text-slate-600">
            Mensuels: {dashboard.monthlySubscriptions} · Annuels: {dashboard.annualSubscriptions}
          </p>
        </section>

        <section className={cardClass}>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">MRR estimé</div>
          <div className="mt-3 text-3xl font-semibold text-slate-950">{dashboard.mrrEquivalentLabel}</div>
          <p className="mt-2 text-sm text-slate-600">Équivalent mensuel des abonnements actifs.</p>
        </section>

        <section className={cardClass}>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Checkouts 30j</div>
          <div className="mt-3 text-3xl font-semibold text-slate-950">{dashboard.checkoutStarted30d}</div>
          <p className="mt-2 text-sm text-slate-600">
            Complétés: {dashboard.checkoutCompleted30d} · Taux: {dashboard.checkoutConversionRate30d}%
          </p>
        </section>

        <section className={cardClass}>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-fuchsia-700">CA brut 30j</div>
          <div className="mt-3 text-3xl font-semibold text-slate-950">{dashboard.grossRevenue30dLabel}</div>
          <p className="mt-2 text-sm text-slate-600">
            Paiements: {dashboard.payments30d} · Remboursés: {dashboard.refundedAmount30dLabel}
          </p>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-slate-950">Suivi trafic et conversion</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Les visites, pages vues et événements de conversion sont envoyés à Vercel Analytics. Ouvrez le dashboard
            du projet pour voir le trafic et les événements.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`${vercelProjectDashboardUrl}/analytics`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Ouvrir Vercel Analytics
            </a>
            <a
              href={vercelProjectDashboardUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
            >
              Ouvrir le projet Vercel
            </a>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>Pages vues: `/`, `/tarifs`, `/compte`, etc.</p>
            <p>Événements custom instrumentés:</p>
            {dashboard.customEvents.map((eventName) => (
              <p key={eventName} className="font-mono text-xs text-slate-500">
                {eventName}
              </p>
            ))}
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-slate-950">État Stripe</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`${stripeDashboardBaseUrl}/payments`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Ouvrir les paiements
            </a>
            <a
              href={`${stripeDashboardBaseUrl}/subscriptions`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
            >
              Ouvrir les abonnements
            </a>
            <a
              href={`${stripeDashboardBaseUrl}/customers`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
            >
              Ouvrir les clients
            </a>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>Stripe configuré: {dashboard.stripeConfigured ? "oui" : "non"}</p>
            <p>Portail client configuré: {dashboard.stripePortalConfigured ? "oui" : "non"}</p>
            <p>Abonnements en essai: {dashboard.subscriptionsTrialing}</p>
            <p>Abonnements en retard de paiement: {dashboard.subscriptionsPastDue}</p>
            <p>Remboursements 30 jours: {dashboard.refundedPayments30d}</p>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-slate-950">Paiements récents</h2>
          <div className="mt-4 space-y-3">
            {dashboard.recentPayments.length === 0 ? (
              <p className="text-sm text-slate-600">Aucun paiement récent.</p>
            ) : (
              dashboard.recentPayments.map((payment) => (
                <div key={payment.id} className="rounded-[18px] border border-slate-200/80 bg-slate-50/80 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900">{payment.amountLabel}</div>
                    <div className="text-slate-500">{payment.createdAt}</div>
                  </div>
                  <div className="mt-1 text-slate-600">{payment.customer}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {payment.status}
                    {payment.refunded ? " · remboursé partiellement ou totalement" : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-slate-950">Abonnements récents</h2>
          <div className="mt-4 space-y-3">
            {dashboard.recentSubscriptions.length === 0 ? (
              <p className="text-sm text-slate-600">Aucun abonnement récent.</p>
            ) : (
              dashboard.recentSubscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="rounded-[18px] border border-slate-200/80 bg-slate-50/80 p-4 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900">{subscription.customer}</div>
                    <div className="text-slate-500">{subscription.createdAt}</div>
                  </div>
                  <div className="mt-1 text-slate-600">
                    Plan: {subscription.plan} · Statut: {subscription.status}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {subscription.periodEnd
                      ? `Période en cours jusqu'au ${subscription.periodEnd}`
                      : "Pas de période active"}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </PageShell>
  )
}
