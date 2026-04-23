"use client"

import Link from "next/link"
import { useState } from "react"
import { trackClientEvent } from "@/lib/client-analytics"
import { reportClientError } from "@/lib/client-monitoring"
import type { PremiumPlanId } from "@/lib/monetization-types"
import type { PromoQuote, PromoValidationPayload } from "@/lib/promo-types"
import { formatEuroFromCents, siteConfig } from "@/lib/site-config"
import { cn } from "@/lib/utils"

interface CheckoutButtonProps {
  className?: string
  label: string
  planId: PremiumPlanId
}

type CheckoutResponsePayload = {
  code?: string
  error?: string
  promo?: PromoValidationPayload
  redirectTo?: string
  url?: string
}

const dynamicPaymentMethods = ["Carte bancaire", "PayPal", "Apple Pay", "Google Pay"] as const

function normalizePromoCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "")
}

function getDueTodayLabel(quote: PromoQuote) {
  if (quote.trialDays) {
    return "0,00 € aujourd'hui"
  }

  return formatEuroFromCents(quote.amountDueNowCents)
}

export function CheckoutButton({ className, label, planId }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)
  const [error, setError] = useState("")
  const [promoError, setPromoError] = useState("")
  const [promoCode, setPromoCode] = useState("")
  const [promoQuote, setPromoQuote] = useState<PromoQuote | null>(null)
  const [hasImmediateAccessConsent, setHasImmediateAccessConsent] = useState(false)

  const validatePromoCode = async () => {
    const normalizedCode = normalizePromoCode(promoCode)

    if (!normalizedCode) {
      setPromoQuote(null)
      setPromoError("")
      return null
    }

    setIsValidatingPromo(true)
    setPromoError("")

    try {
      const response = await fetch("/api/promos/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: normalizedCode,
          planId,
        }),
      })
      const payload = (await response.json()) as PromoValidationPayload

      if (!response.ok || !payload.valid || !payload.quote) {
        throw new Error(payload.message || "Code promo invalide.")
      }

      setPromoQuote(payload.quote)
      trackClientEvent("promo_code_validated", {
        code: payload.quote.code,
        kind: payload.quote.kind,
        planId,
      })
      return payload.quote
    } catch (caughtError) {
      reportClientError("promo-validation", caughtError, { planId })
      setPromoQuote(null)
      setPromoError(caughtError instanceof Error ? caughtError.message : "Code promo invalide.")
      return null
    } finally {
      setIsValidatingPromo(false)
    }
  }

  const handleCheckout = async () => {
    if (!hasImmediateAccessConsent) {
      setError(
        "Vous devez confirmer l'activation immédiate du service et votre renonciation au droit de rétractation.",
      )
      return
    }

    setIsLoading(true)
    setError("")
    trackClientEvent("pricing_cta_clicked", {
      label,
      planId,
      path: window.location.pathname,
    })

    try {
      const normalizedCode = normalizePromoCode(promoCode)
      let activePromoQuote = promoQuote

      if (normalizedCode && promoQuote?.code !== normalizedCode) {
        activePromoQuote = await validatePromoCode()

        if (!activePromoQuote) {
          return
        }
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          promoCode: activePromoQuote?.code,
          immediateAccessConsent: hasImmediateAccessConsent,
          withdrawalWaiver: hasImmediateAccessConsent,
        }),
      })

      const payload = (await response.json()) as CheckoutResponsePayload

      if (response.status === 401 && payload.code === "auth_required") {
        const redirectTo = payload.redirectTo?.startsWith("/")
          ? payload.redirectTo
          : `/compte?checkoutPlan=${encodeURIComponent(planId)}`

        trackClientEvent("checkout_auth_required", { planId })
        window.location.href = redirectTo
        return
      }

      if (response.status === 400 && payload.code === "promo_invalid") {
        setPromoError(payload.promo?.message ?? payload.error ?? "Code promo invalide.")
        return
      }

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Paiement indisponible pour le moment.")
      }

      trackClientEvent("checkout_redirected", {
        planId,
        promoCode: activePromoQuote?.code ?? null,
        promoKind: activePromoQuote?.kind ?? null,
      })
      window.location.href = payload.url
    } catch (caughtError) {
      reportClientError("checkout-button", caughtError, { planId })
      setError(caughtError instanceof Error ? caughtError.message : "Impossible de démarrer le paiement.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[20px] border border-slate-200/80 bg-white/80 p-3">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Paiement sécurisé</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {dynamicPaymentMethods.map((method) => (
            <span
              key={method}
              className="rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
            >
              {method}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Les moyens de paiement disponibles s’affichent automatiquement selon votre appareil, votre navigateur et votre
          pays. Si un portefeuille numérique n’est pas disponible, la carte bancaire reste proposée.
        </p>
      </div>

      <div className="rounded-[20px] border border-slate-200/80 bg-slate-50/80 p-3">
        <label htmlFor={`promo-${planId}`} className="text-sm font-semibold text-slate-800">
          Code promo
        </label>
        <div className="mt-2 flex flex-col gap-2">
          <input
            id={`promo-${planId}`}
            type="text"
            value={promoCode}
            onChange={(event) => {
              setPromoCode(event.currentTarget.value)
              setPromoQuote(null)
              setPromoError("")
            }}
            className="min-h-11 flex-1 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            disabled={isLoading || isValidatingPromo}
            suppressHydrationWarning
          />
          <button
            type="button"
            className="min-h-11 w-full rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:text-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={validatePromoCode}
            disabled={!promoCode.trim() || isLoading || isValidatingPromo}
          >
            {isValidatingPromo ? "Vérification..." : "Appliquer"}
          </button>
        </div>
        {promoQuote && (
          <div className="mt-3 rounded-[18px] border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-950">
            <div className="font-semibold">{promoQuote.message}</div>
            <div className="mt-1 text-xs text-emerald-800">
              Prix initial : {formatEuroFromCents(promoQuote.baseAmountCents)} · Réduction :{" "}
              {formatEuroFromCents(promoQuote.discountAmountCents)} · À payer : {getDueTodayLabel(promoQuote)}
            </div>
          </div>
        )}
        {promoError && <div className="mt-2 text-sm text-red-600">{promoError}</div>}
      </div>

      <label className="flex items-start gap-3 rounded-[20px] border border-slate-200/80 bg-slate-50/80 p-3 text-sm leading-5 text-slate-600">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-700"
          checked={hasImmediateAccessConsent}
          onChange={(event) => setHasImmediateAccessConsent(event.currentTarget.checked)}
          suppressHydrationWarning
        />
        <span>
          J'accepte l'activation immédiate du service premium et je renonce à mon droit de rétractation une fois l'accès
          activé. Voir les{" "}
          <Link href="/cgv" className="font-medium text-sky-800 hover:underline">
            CGV
          </Link>
          .
        </span>
      </label>
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-22px_rgba(15,23,42,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:translate-y-0 disabled:cursor-not-allowed disabled:shadow-none disabled:opacity-50",
          className,
        )}
        onClick={handleCheckout}
        disabled={isLoading || isValidatingPromo}
      >
        {isLoading ? "Redirection..." : promoQuote?.trialDays ? "Activer l'essai gratuit" : label}
      </button>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!siteConfig.launch.stripeEnabled && (
        <div className="text-xs text-slate-500">
          Le paiement reste à finaliser avant lancement public.
        </div>
      )}
    </div>
  )
}
