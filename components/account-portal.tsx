"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AccountAuthCard } from "@/components/account-auth-card"
import { BillingPortalButton } from "@/components/billing-portal-button"
import { CheckoutButton } from "@/components/checkout-button"
import { trackClientEvent } from "@/lib/client-analytics"
import { reportClientError } from "@/lib/client-monitoring"
import type { AccessSnapshot, PremiumPlanId } from "@/lib/monetization-types"
import { getPlanLabel, getPlanPriceLabel, siteConfig } from "@/lib/site-config"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"
import { isSupabaseAuthConfigured } from "@/lib/supabase/config"

type AccessResponsePayload = { access?: AccessSnapshot; error?: string }

const cardClass =
  "rounded-[24px] border border-slate-200/80 bg-white/78 p-5 shadow-[0_22px_50px_-42px_rgba(15,23,42,0.24)]"

function formatDate(value?: string | null) {
  if (!value) {
    return null
  }

  return new Date(value).toLocaleString("fr-FR")
}

function isCheckoutPlanId(value: string | null): value is PremiumPlanId {
  return value === "monthly" || value === "annual" || value === "day-pass"
}

export function AccountPortal() {
  const [accessSnapshot, setAccessSnapshot] = useState<AccessSnapshot | null>(null)
  const [checkoutPlanId, setCheckoutPlanId] = useState<PremiumPlanId | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const accountsEnabled = isSupabaseAuthConfigured()

  const loadAccessSnapshot = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/access", {
        cache: "no-store",
      })
      const payload = (await response.json()) as AccessResponsePayload

      if (!response.ok || !payload.access) {
        throw new Error(payload.error ?? "Impossible de charger votre espace client.")
      }

      setAccessSnapshot(payload.access)
      setError("")
    } catch (caughtError) {
      reportClientError("account-portal", caughtError)
      setError(
        "Impossible de charger votre espace client pour le moment. Réessayez dans quelques instants.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadAccessSnapshot()
  }, [])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const planId = searchParams.get("checkoutPlan")

    if (isCheckoutPlanId(planId)) {
      setCheckoutPlanId(planId)
    }
  }, [])

  useEffect(() => {
    if (!accountsEnabled) {
      return
    }

    const supabase = getSupabaseBrowserClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadAccessSnapshot()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [accountsEnabled])

  const planLabel =
    accessSnapshot?.plan && accessSnapshot.plan !== "free" ? getPlanLabel(accessSnapshot.plan) : "Accès gratuit"
  const checkoutPlanLabel = checkoutPlanId ? getPlanLabel(checkoutPlanId) : null
  const checkoutPlanPriceLabel = checkoutPlanId ? getPlanPriceLabel(checkoutPlanId) : null

  return (
    <div className="space-y-6">
      <section className={cardClass}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">Compte et accès</div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {isLoading ? "Chargement..." : planLabel}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {accountsEnabled
                ? "Votre compte Label2A4 se connecte avec email et mot de passe. Le lien email reste disponible en secours depuis la page de connexion."
                : "Cet espace vous permet de vérifier votre état d'accès, votre quota et vos liens de facturation."}
            </p>
          </div>

          <div className="rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            <div>
              <strong>Statut :</strong>{" "}
              {isLoading
                ? "Chargement..."
                : accessSnapshot?.isPremium
                  ? "Premium actif"
                  : accessSnapshot?.isAuthenticated
                    ? "Compte connecté"
                    : "Invité"}
            </div>
            {accessSnapshot?.userEmail && (
              <div className="mt-1">
                <strong>Email :</strong> {accessSnapshot.userEmail}
              </div>
            )}
            {accessSnapshot?.subscriptionStatus && (
              <div className="mt-1">
                <strong>État de facturation :</strong> {accessSnapshot.subscriptionStatus}
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

      {accountsEnabled && (
        <section id="connexion" className={cardClass}>
          <h2 className="text-xl font-semibold text-slate-950">
            {checkoutPlanId ? "Finaliser avec mon compte" : "Connexion et sécurité"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {checkoutPlanId && checkoutPlanLabel && !accessSnapshot?.isAuthenticated
              ? `Vous avez choisi ${checkoutPlanLabel}${checkoutPlanPriceLabel ? ` (${checkoutPlanPriceLabel})` : ""}. Connectez-vous pour rattacher l'achat à ce compte avant le paiement.`
              : "Gérez votre session et votre email de compte. La connexion principale utilise maintenant un mot de passe."}
          </p>
          {!isLoading && !accessSnapshot?.isAuthenticated && (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                ["1", "Entrez votre email"],
                ["2", "Saisissez votre mot de passe"],
                ["3", "Retrouvez vos achats ici"],
              ].map(([step, label]) => (
                <div key={step} className="rounded-[18px] border border-slate-200/80 bg-slate-50/80 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                    {step}
                  </div>
                  <div className="mt-3 text-sm font-medium text-slate-800">{label}</div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 max-w-md">
            {isLoading ? (
              <div className="rounded-[20px] border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-600">
                Chargement de votre session...
              </div>
            ) : (
              <AccountAuthCard
                email={accessSnapshot?.userEmail}
                isAuthenticated={Boolean(accessSnapshot?.isAuthenticated)}
                onSessionChanged={loadAccessSnapshot}
              />
            )}
          </div>
          {checkoutPlanId && accessSnapshot?.isAuthenticated && (
            <div className="mt-5 max-w-md rounded-[20px] border border-sky-100 bg-sky-50/70 p-4">
              {accessSnapshot.isPremium ? (
                <p className="text-sm leading-6 text-sky-950">
                  Votre accès premium est déjà actif. Vous pouvez retrouver vos informations de facturation plus bas.
                </p>
              ) : (
                <>
                  <p className="mb-4 text-sm leading-6 text-sky-950">
                    Compte connecté. Vous pouvez maintenant continuer vers le paiement pour{" "}
                    <strong>{checkoutPlanLabel}</strong>.
                  </p>
                  <CheckoutButton
                    planId={checkoutPlanId}
                    label="Continuer vers le paiement"
                    className="w-full bg-slate-950 text-white hover:bg-slate-800"
                  />
                </>
              )}
            </div>
          )}
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-slate-950">Utilisation</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {isLoading
              ? "Chargement du quota en cours."
              : accessSnapshot?.isPremium
                ? "Votre plan premium supprime la limite quotidienne d'export tant qu'il reste actif."
                : `Il vous reste ${accessSnapshot?.remainingSheetsToday ?? siteConfig.pricing.freeDailyA4Sheets} planche(s) A4 aujourd'hui sur ${accessSnapshot?.dailyLimit ?? siteConfig.pricing.freeDailyA4Sheets}.`}
          </p>
          {!accessSnapshot?.isPremium && (
            <div className="mt-5">
              <Link
                href="/tarifs"
                className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
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
            Depuis le portail de facturation, vous pouvez consulter vos reçus ou factures, mettre à jour votre moyen de
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
                  {!accessSnapshot?.paymentsAvailable
                    ? "Le portail de facturation n'est pas encore disponible."
                    : accountsEnabled && !accessSnapshot?.isAuthenticated
                      ? "Connectez-vous d'abord à votre compte pour retrouver vos achats et votre portail de facturation."
                      : "Le portail apparaîtra dès qu'un achat sera rattaché à ce compte."}
                </p>
                <Link
                  href="/tarifs"
                  className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
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
            <p>1. Vérifier votre plan actif et votre quota restant.</p>
            <p>2. Ouvrir le portail de facturation pour les reçus, la carte bancaire et la résiliation.</p>
            <p>3. Retrouver vos accès premium depuis n'importe quel appareil connecté au même compte.</p>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-slate-950">Aide</h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
            <p>
              Si votre achat n'apparaît pas sur votre compte ou si le portail n'est pas accessible, contactez{" "}
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
