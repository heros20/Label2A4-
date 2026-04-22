import { AccountAuthCard } from "@/components/account-auth-card"
import { PageShell } from "@/components/page-shell"

export const metadata = {
  title: "Mot de passe oublié",
}

const cardClass =
  "rounded-[24px] border border-slate-200/80 bg-white/78 p-5 shadow-[0_22px_50px_-42px_rgba(15,23,42,0.24)]"

export default function MotDePasseOubliePage() {
  return (
    <PageShell
      title="Mot de passe oublié"
      intro="Recevez un email sécurisé pour définir un nouveau mot de passe Label2A4."
    >
      <section className={cardClass}>
        <h2 className="text-xl font-semibold text-slate-950">Réinitialisation</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          L’email contient un lien valable temporairement vers la page de définition du nouveau mot de passe.
        </p>
        <div className="mt-5 max-w-md">
          <AccountAuthCard initialMode="forgot-password" isAuthenticated={false} />
        </div>
      </section>
    </PageShell>
  )
}
