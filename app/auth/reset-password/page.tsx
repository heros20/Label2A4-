import { PasswordResetCard } from "@/components/password-reset-card"
import { PageShell } from "@/components/page-shell"

export const metadata = {
  title: "Nouveau mot de passe",
}

const cardClass =
  "rounded-[24px] border border-slate-200/80 bg-white/78 p-5 shadow-[0_22px_50px_-42px_rgba(15,23,42,0.24)]"

export default function ResetPasswordPage() {
  return (
    <PageShell
      title="Nouveau mot de passe"
      intro="Choisissez un nouveau mot de passe pour sécuriser votre compte Label2A4."
    >
      <section className={cardClass}>
        <h2 className="text-xl font-semibold text-slate-950">Mettre à jour le mot de passe</h2>
        <div className="mt-5 max-w-md">
          <PasswordResetCard />
        </div>
      </section>
    </PageShell>
  )
}
