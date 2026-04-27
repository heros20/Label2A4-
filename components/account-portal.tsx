"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { AccountAuthCard } from "@/components/account-auth-card"
import { BillingPortalButton } from "@/components/billing-portal-button"
import { CheckoutButton } from "@/components/checkout-button"
import { localizePath, type Locale } from "@/lib/i18n"
import { trackClientEvent } from "@/lib/client-analytics"
import { reportClientError } from "@/lib/client-monitoring"
import type { AccessSnapshot, PremiumPlanId } from "@/lib/monetization-types"
import { getPlanLabel, getPlanPriceLabel, siteConfig } from "@/lib/site-config"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"
import { isSupabaseAuthConfigured } from "@/lib/supabase/config"

type AccessResponsePayload = { access?: AccessSnapshot; error?: string }

const cardClass =
  "rounded-[24px] border border-slate-200/80 bg-white/78 p-5 shadow-[0_22px_50px_-42px_rgba(15,23,42,0.24)]"

function formatDate(value: string | null | undefined, locale: Locale) {
  if (!value) {
    return null
  }

  return new Date(value).toLocaleString(locale === "en" ? "en-US" : "fr-FR")
}

function isCheckoutPlanId(value: string | null): value is PremiumPlanId {
  return value === "monthly" || value === "annual" || value === "day-pass"
}

export function AccountPortal({ locale }: { locale: Locale }) {
  const [accessSnapshot, setAccessSnapshot] = useState<AccessSnapshot | null>(null)
  const [checkoutPlanId, setCheckoutPlanId] = useState<PremiumPlanId | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const accountsEnabled = isSupabaseAuthConfigured()

  const loadAccessSnapshot = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/access", {
        cache: "no-store",
      })
      const payload = (await response.json()) as AccessResponsePayload

      if (!response.ok || !payload.access) {
        throw new Error(
          payload.error ??
            (locale === "en"
              ? "Unable to load your account area."
              : "Impossible de charger votre espace client."),
        )
      }

      setAccessSnapshot(payload.access)
      setError("")
    } catch (caughtError) {
      reportClientError("account-portal", caughtError)
      setError(
        locale === "en"
          ? "Unable to load your account area right now. Please try again in a moment."
          : "Impossible de charger votre espace client pour le moment. Réessayez dans quelques instants.",
      )
    } finally {
      setIsLoading(false)
    }
  }, [locale])

  useEffect(() => {
    void loadAccessSnapshot()
  }, [loadAccessSnapshot])

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
  }, [accountsEnabled, loadAccessSnapshot])

  const planLabel =
    accessSnapshot?.plan && accessSnapshot.plan !== "free"
      ? getPlanLabel(accessSnapshot.plan, locale)
      : locale === "en"
        ? "Free access"
        : "Accès gratuit"
  const checkoutPlanLabel = checkoutPlanId ? getPlanLabel(checkoutPlanId, locale) : null
  const checkoutPlanPriceLabel = checkoutPlanId ? getPlanPriceLabel(checkoutPlanId, locale) : null

  return (
    <div className="space-y-6">
      <section className={cardClass}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">
              {locale === "en" ? "Account and access" : "Compte et accès"}
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {isLoading ? (locale === "en" ? "Loading..." : "Chargement...") : planLabel}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {accountsEnabled
                ? locale === "en"
                  ? "Your Label2A4 account uses email and password. Email sign-in links remain available as a backup from the sign-in page."
                  : "Votre compte Label2A4 se connecte avec email et mot de passe. Le lien email reste disponible en secours depuis la page de connexion."
                : locale === "en"
                  ? "This area lets you check your access status, quota and billing links."
                  : "Cet espace vous permet de vérifier votre état d'accès, votre quota et vos liens de facturation."}
            </p>
          </div>

          <div className="rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            <div>
              <strong>{locale === "en" ? "Status:" : "Statut :"}</strong>{" "}
              {isLoading
                ? locale === "en"
                  ? "Loading..."
                  : "Chargement..."
                : accessSnapshot?.isPremium
                  ? locale === "en"
                    ? "Premium active"
                    : "Premium actif"
                  : accessSnapshot?.isAuthenticated
                    ? locale === "en"
                      ? "Signed in"
                      : "Compte connecté"
                    : locale === "en"
                      ? "Guest"
                      : "Invité"}
            </div>
            {accessSnapshot?.userEmail && (
              <div className="mt-1">
                <strong>Email:</strong> {accessSnapshot.userEmail}
              </div>
            )}
            {accessSnapshot?.subscriptionStatus && (
              <div className="mt-1">
                <strong>{locale === "en" ? "Billing status:" : "État de facturation :"}</strong>{" "}
                {accessSnapshot.subscriptionStatus}
              </div>
            )}
            {accessSnapshot?.expiresAt && (
              <div className="mt-1">
                <strong>{locale === "en" ? "Expires on:" : "Expire le :"}</strong>{" "}
                {formatDate(accessSnapshot.expiresAt, locale)}
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
            {checkoutPlanId
              ? locale === "en"
                ? "Continue with my account"
                : "Finaliser avec mon compte"
              : locale === "en"
                ? "Sign-in and security"
                : "Connexion et sécurité"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {checkoutPlanId && checkoutPlanLabel && !accessSnapshot?.isAuthenticated
              ? locale === "en"
                ? `You selected ${checkoutPlanLabel}${checkoutPlanPriceLabel ? ` (${checkoutPlanPriceLabel})` : ""}. Sign in to attach this purchase to your account before payment.`
                : `Vous avez choisi ${checkoutPlanLabel}${checkoutPlanPriceLabel ? ` (${checkoutPlanPriceLabel})` : ""}. Connectez-vous pour rattacher l'achat à ce compte avant le paiement.`
              : locale === "en"
                ? "Manage your session and account email. The primary sign-in method now uses a password."
                : "Gérez votre session et votre email de compte. La connexion principale utilise maintenant un mot de passe."}
          </p>
          {!isLoading && !accessSnapshot?.isAuthenticated && (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {(
                locale === "en"
                  ? [
                      ["1", "Enter your email"],
                      ["2", "Enter your password"],
                      ["3", "Find your purchases here"],
                    ]
                  : [
                      ["1", "Entrez votre email"],
                      ["2", "Saisissez votre mot de passe"],
                      ["3", "Retrouvez vos achats ici"],
                    ]
              ).map(([step, label]) => (
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
                {locale === "en" ? "Loading your session..." : "Chargement de votre session..."}
              </div>
            ) : (
              <AccountAuthCard
                email={accessSnapshot?.userEmail}
                isAuthenticated={Boolean(accessSnapshot?.isAuthenticated)}
                locale={locale}
                onSessionChanged={loadAccessSnapshot}
              />
            )}
          </div>
          {checkoutPlanId && accessSnapshot?.isAuthenticated && (
            <div className="mt-5 max-w-md rounded-[20px] border border-sky-100 bg-sky-50/70 p-4">
              {accessSnapshot.isPremium ? (
                <p className="text-sm leading-6 text-sky-950">
                  {locale === "en"
                    ? "Your premium access is already active. You can find your billing details below."
                    : "Votre accès premium est déjà actif. Vous pouvez retrouver vos informations de facturation plus bas."}
                </p>
              ) : (
                <>
                  <p className="mb-4 text-sm leading-6 text-sky-950">
                    {locale === "en" ? "Signed in. You can now continue to payment for" : "Compte connecté. Vous pouvez maintenant continuer vers le paiement pour"}{" "}
                    <strong>{checkoutPlanLabel}</strong>.
                  </p>
                  <CheckoutButton
                    planId={checkoutPlanId}
                    label={locale === "en" ? "Continue to payment" : "Continuer vers le paiement"}
                    locale={locale}
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
          <h2 className="text-xl font-semibold text-slate-950">{locale === "en" ? "Usage" : "Utilisation"}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {isLoading
              ? locale === "en"
                ? "Loading your quota."
                : "Chargement du quota en cours."
              : accessSnapshot?.isPremium
                ? locale === "en"
                  ? "Your premium plan removes the daily export limit for as long as it stays active."
                  : "Votre plan premium supprime la limite quotidienne d'export tant qu'il reste actif."
                : locale === "en"
                  ? `You still have ${accessSnapshot?.remainingSheetsToday ?? siteConfig.pricing.freeDailyA4Sheets} A4 sheet(s) available today out of ${accessSnapshot?.dailyLimit ?? siteConfig.pricing.freeDailyA4Sheets}.`
                  : `Il vous reste ${accessSnapshot?.remainingSheetsToday ?? siteConfig.pricing.freeDailyA4Sheets} planche(s) A4 aujourd'hui sur ${accessSnapshot?.dailyLimit ?? siteConfig.pricing.freeDailyA4Sheets}.`}
          </p>
          {!accessSnapshot?.isPremium && (
            <div className="mt-5">
              <Link
                href={localizePath("/tarifs", locale)}
                className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                onClick={() => trackClientEvent("account_upgrade_clicked", { path: window.location.pathname })}
              >
                {locale === "en" ? "Upgrade to premium" : "Passer en premium"}
              </Link>
            </div>
          )}
        </section>

        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-slate-950">
            {locale === "en" ? "Billing and subscription" : "Facturation et abonnement"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {locale === "en"
              ? "From the billing portal, you can view receipts or invoices, update your payment method and cancel your subscription online."
              : "Depuis le portail de facturation, vous pouvez consulter vos reçus ou factures, mettre à jour votre moyen de paiement et résilier votre abonnement en ligne."}
          </p>

          <div className="mt-5">
            {accessSnapshot?.billingPortalAvailable ? (
              <BillingPortalButton
                label={locale === "en" ? "Open billing portal" : "Ouvrir le portail de facturation"}
                locale={locale}
                className="inline-flex items-center rounded-full bg-[linear-gradient(135deg,#0f172a,#0369a1)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              />
            ) : (
              <div className="space-y-3 text-sm leading-6 text-slate-600">
                <p>
                  {!accessSnapshot?.paymentsAvailable
                    ? locale === "en"
                      ? "The billing portal is not available yet."
                      : "Le portail de facturation n'est pas encore disponible."
                    : accountsEnabled && !accessSnapshot?.isAuthenticated
                      ? locale === "en"
                        ? "Sign in to your account first to access your purchases and billing portal."
                        : "Connectez-vous d'abord à votre compte pour retrouver vos achats et votre portail de facturation."
                      : locale === "en"
                        ? "The portal will appear as soon as a purchase is attached to this account."
                        : "Le portail apparaîtra dès qu'un achat sera rattaché à ce compte."}
                </p>
                <Link
                  href={localizePath("/tarifs", locale)}
                  className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                  onClick={() => trackClientEvent("account_upgrade_clicked", { path: window.location.pathname })}
                >
                  {locale === "en" ? "View plans" : "Voir les offres"}
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-slate-950">
            {locale === "en" ? "What this area covers" : "Ce que couvre cet espace"}
          </h2>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <p>
              1. {locale === "en" ? "Check your active plan and remaining quota." : "Vérifier votre plan actif et votre quota restant."}
            </p>
            <p>
              2. {locale === "en"
                ? "Open the billing portal for receipts, card updates and cancellation."
                : "Ouvrir le portail de facturation pour les reçus, la carte bancaire et la résiliation."}
            </p>
            <p>
              3. {locale === "en"
                ? "Recover your premium access from any device signed in to the same account."
                : "Retrouver vos accès premium depuis n'importe quel appareil connecté au même compte."}
            </p>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-slate-950">{locale === "en" ? "Help" : "Aide"}</h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
            <p>
              {locale === "en"
                ? "If your purchase does not appear on your account or the billing portal is not accessible, contact"
                : "Si votre achat n'apparaît pas sur votre compte ou si le portail n'est pas accessible, contactez"}{" "}
              <a href={`mailto:${siteConfig.supportEmail}`} className="font-medium text-sky-800 hover:underline">
                {siteConfig.supportEmail}
              </a>
              .
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={localizePath("/faq", locale)} className="text-sky-800 hover:underline">
                FAQ
              </Link>
              <Link href={localizePath("/cgv", locale)} className="text-sky-800 hover:underline">
                CGV
              </Link>
              <Link href={localizePath("/remboursement", locale)} className="text-sky-800 hover:underline">
                {locale === "en" ? "Refunds" : "Remboursement"}
              </Link>
              <Link href={localizePath("/resiliation", locale)} className="text-sky-800 hover:underline">
                {locale === "en" ? "Cancellation" : "Résiliation"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
