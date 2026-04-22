import { AdminLoginForm } from "@/components/admin-login-form"
import { AdminLogoutButton } from "@/components/admin-logout-button"
import { AdminPromoManager } from "@/components/admin-promo-manager"
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
  "Connexion email + mot de passe ajoutée avec Supabase signInWithPassword.",
  "Création de compte ajoutée avec Supabase signUp et validation minimale du mot de passe.",
  "Mot de passe oublié ajouté avec resetPasswordForEmail, puis définition du nouveau mot de passe avec updateUser.",
  "Le lien magique existant est conservé en option secondaire depuis la page de connexion.",
  "La route /compte est protégée côté serveur par le proxy Next 16 et redirige vers /connexion si aucune session n'est active.",
  "La home affiche discrètement Se connecter / Créer un compte, ou Mon espace / Se déconnecter si l'utilisateur est connecté.",
  "Les textes de l'espace compte ont été ajustés pour faire du mot de passe le parcours principal.",
] as const

const ownerTodoItems = [
  "Dans Supabase Auth, vérifier que le provider Email est activé et décider si la confirmation email est obligatoire.",
  "Ajouter l'URL du site dans Site URL : http://localhost:3000 en local, puis l'URL Vercel de production.",
  "Autoriser les Redirect URLs : http://localhost:3000/auth/callback, http://localhost:3000/auth/reset-password, https://label2a4.com/auth/callback et https://label2a4.com/auth/reset-password.",
  "Vérifier les templates Supabase de confirmation email et de reset password.",
  "Tester création de compte, connexion, déconnexion, mauvais mot de passe, mot de passe oublié, reset, home connecté/déconnecté et accès /compte sans session.",
  "Vérifier en production que les variables NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY et SUPABASE_SERVICE_ROLE_KEY sont bien configurées.",
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
        <a
          href="#gestion-promos"
          className="rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:text-sky-800"
        >
          Promos
        </a>
        <a
          href="#operations-admin"
          className="rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:text-sky-800"
        >
          Impact / quota
        </a>
      </nav>

      <section id="derniere-mise-a-jour" className={cardClass}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">Dernière mise à jour</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Auth email + mot de passe
            </h2>
          </div>
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            Patch auth vérifié
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

        <div id="gestion-promos" className="mt-5 rounded-[20px] border border-slate-200/80 bg-slate-50/80 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-slate-950">Codes promo et utilité</h3>
            <div className="text-xs font-medium text-slate-500">
              {dashboard.promoCodesConfigured
                ? "Codes lus depuis Supabase"
                : "Schéma promo à appliquer dans Supabase"}
            </div>
          </div>

          <div className="mt-4">
            <AdminPromoManager configured={dashboard.promoCodesConfigured} promoCodes={dashboard.promoCodes} />
          </div>
        </div>
      </section>

      <section id="operations-admin" className={cardClass}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Impact / quota / promo
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Tableau opérationnel</h2>
          </div>
          <div
            className={
              dashboard.operationalRowsConfigured
                ? "w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                : "w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
            }
          >
            {dashboard.operationalRowsConfigured ? "Données Supabase" : "Configuration incomplète"}
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.14em] text-slate-500">
                <th className="border-b border-slate-200 px-3 py-3 font-semibold">Catégorie</th>
                <th className="border-b border-slate-200 px-3 py-3 font-semibold">Indicateur</th>
                <th className="border-b border-slate-200 px-3 py-3 font-semibold">Valeur</th>
                <th className="border-b border-slate-200 px-3 py-3 font-semibold">Détail</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.operationalRows.map((row) => (
                <tr key={`${row.category}-${row.metric}`} className="align-top">
                  <td className="border-b border-slate-100 px-3 py-3 font-medium text-slate-900">{row.category}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-slate-700">{row.metric}</td>
                  <td className="border-b border-slate-100 px-3 py-3">
                    <span
                      className={
                        row.status === "ok"
                          ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                          : row.status === "warning"
                            ? "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
                            : "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                      }
                    >
                      {row.value}
                    </span>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
