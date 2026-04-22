import { AccountAuthCard } from "@/components/account-auth-card"
import { PageShell } from "@/components/page-shell"

export const metadata = {
  title: "Connexion",
}

const cardClass =
  "rounded-[24px] border border-slate-200/80 bg-white/78 p-5 shadow-[0_22px_50px_-42px_rgba(15,23,42,0.24)]"

export default function ConnexionPage() {
  return (
    <PageShell title="Connexion" intro="Connectez-vous à votre espace Label2A4 avec votre email et votre mot de passe.">
      <section className={cardClass}>
        <h2 className="text-xl font-semibold text-slate-950">Se connecter</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Le lien de connexion par email reste disponible en option secondaire.
        </p>
        <div className="mt-5 max-w-md">
          <AccountAuthCard initialMode="sign-in" isAuthenticated={false} />
        </div>
      </section>
    </PageShell>
  )
}
