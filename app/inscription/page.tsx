import { AccountAuthCard } from "@/components/account-auth-card"
import { PageShell } from "@/components/page-shell"

export const metadata = {
  title: "Créer un compte",
}

const cardClass =
  "rounded-[24px] border border-slate-200/80 bg-white/78 p-5 shadow-[0_22px_50px_-42px_rgba(15,23,42,0.24)]"

export default function InscriptionPage() {
  return (
    <PageShell
      title="Créer un compte"
      intro="Créez votre compte Label2A4 avec un email et un mot de passe pour retrouver vos achats, quotas et factures."
    >
      <section className={cardClass}>
        <h2 className="text-xl font-semibold text-slate-950">Nouveau compte</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Si Supabase demande une confirmation email, le compte sera actif après validation du lien reçu.
        </p>
        <div className="mt-5 max-w-md">
          <AccountAuthCard initialMode="sign-up" isAuthenticated={false} />
        </div>
      </section>
    </PageShell>
  )
}
