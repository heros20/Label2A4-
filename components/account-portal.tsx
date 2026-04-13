"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { BillingPortalButton } from "@/components/billing-portal-button"
import { trackClientEvent } from "@/lib/client-analytics"
import { reportClientError } from "@/lib/client-monitoring"
import type { AccessSnapshot } from "@/lib/monetization-types"
import { getPlanLabel, siteConfig } from "@/lib/site-config"

type AccessResponsePayload = { access?: AccessSnapshot; error?: string }

const cardClass =
  "rounded-[24px] border border-slate-200/80 bg-white/78 p-5 shadow-[0_22px_50px_-42px_rgba(15,23,42,0.24)]"

function formatDate(value?: string | null) {
  if (!value) {
    return null
  }

  return new Date(value).toLocaleString("fr-FR")
}

export function AccountPortal() {
  const [accessSnapshot, setAccessSnapshot] = useState<AccessSnapshot | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    fetch("/api/access", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as AccessResponsePayload

        if (!response.ok || !payload.access) {
          throw new Error(payload.error ?? "Impossible de charger votre espace client.")
        }

        if (active) {
          setAccessSnapshot(payload.access)
          setError("")
        }
      })
      .catch((caughtError) => {
        if (!active || (caughtError instanceof DOMException && caughtError.name === "AbortError")) {
          return
        }

        reportClientError("account-portal", caughtError)

        if (active) {
          setError(
            "Impossible de charger votre état d’abonnement pour ce navigateur. Réessayez dans quelques instants.",
          )
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  const planLabel =
    accessSnapshot?.plan && accessSnapshot.plan !== "free" ? getPlanLabel(accessSnapshot.plan) : "Accès gratuit"

  return (
    <div className="space-y-6">
      <section className={cardClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">Mon accès</div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {isLoading ? "Chargement..." : planLabel}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Cet espace vous permet de vérifier l’état du plan actif sur ce navigateur et d’ouvrir le portail Stripe
              pour la facturation, les reçus, le moyen de paiement et la résiliation.
            </p>
          </div>

          <div className="rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            <div>
              <strong>Statut :</strong>{" "}
              {isLoading ? "Chargement..." : accessSnapshot?.isPremium ? "Premium actif" : "Gratuit"}
            </div>
            {accessSnapshot?.subscriptionStatus && (
              <div className="mt-1">
                <strong>État Stripe :</strong> {accessSnapshot.subscriptionStatus}
              </div>
            )}
            {accessSnapshot?.expiresAt && (
              <div className="mt-1">
                <strong>Expire le :</strong> {formatDate(accessSnapshot.expiresAt)}
              </div>
            )}
          </div>
        </div>
      </section>

      {error && (
        <section className="rounded-[22px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
          {error}
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-slate-950">Utilisation</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {isLoading
              ? "Chargement du quota en cours."
              : accessSnapshot?.isPremium
                ? "Votre plan premium supprime la limite quotidienne d’export sur ce navigateur."
                : `Il vous reste ${accessSnapshot?.remainingSheetsToday ?? siteConfig.pricing.freeDailyA4Sheets} planche(s) A4 aujourd’hui sur ${accessSnapshot?.dailyLimit ?? siteConfig.pricing.freeDailyA4Sheets}.`}
          </p>
          {!accessSnapshot?.isPremium && (
            <div className="mt-5">
              <Link
                href="/tarifs"
                className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                onClick={() => trackClientEvent("account_upgrade_clicked", { path: window.location.pathname })}
              >
                Passer en premium
              </Link>
            </div>
          )}
        </section>

        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-slate-950">Facturation et abonnement</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Depuis le portail Stripe, vous pouvez consulter vos reçus ou factures, mettre à jour votre moyen de
            paiement et résilier votre abonnement en ligne.
          </p>

          <div className="mt-5">
            {accessSnapshot?.billingPortalAvailable ? (
              <BillingPortalButton
                label="Ouvrir le portail de facturation"
                className="inline-flex items-center rounded-full bg-[linear-gradient(135deg,#0f172a,#0369a1)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              />
            ) : (
              <div className="space-y-3 text-sm leading-6 text-slate-600">
                <p>
                  {accessSnapshot?.paymentsAvailable
                    ? "Le portail sera disponible dès qu’un abonnement ou un achat facturable sera rattaché à ce navigateur."
                    : "Le portail Stripe n’est pas encore disponible sur cet environnement."}
                </p>
                <Link
                  href="/tarifs"
                  className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
                  onClick={() => trackClientEvent("account_upgrade_clicked", { path: window.location.pathname })}
                >
                  Voir les offres
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-slate-950">Ce que couvre cet espace</h2>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <p>1. Vérifier le plan actif sur ce navigateur.</p>
            <p>2. Ouvrir le portail Stripe pour les reçus, la carte bancaire et la résiliation.</p>
            <p>3. Revenir rapidement vers les CGV, le remboursement et le support.</p>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-slate-950">Aide</h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
            <p>
              Si votre abonnement n’apparaît pas sur ce navigateur ou si le portail n’est pas accessible, contactez{" "}
              <a href={`mailto:${siteConfig.supportEmail}`} className="font-medium text-sky-800 hover:underline">
                {siteConfig.supportEmail}
              </a>
              .
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/faq" className="text-sky-800 hover:underline">
                FAQ
              </Link>
              <Link href="/cgv" className="text-sky-800 hover:underline">
                CGV
              </Link>
              <Link href="/remboursement" className="text-sky-800 hover:underline">
                Remboursement
              </Link>
              <Link href="/resiliation" className="text-sky-800 hover:underline">
                Résiliation
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
