"use client"

import Link from "next/link"
import { useState } from "react"
import { trackClientEvent } from "@/lib/client-analytics"
import { reportClientError } from "@/lib/client-monitoring"
import type { PremiumPlanId } from "@/lib/monetization-types"
import { siteConfig } from "@/lib/site-config"

interface CheckoutButtonProps {
  className?: string
  label: string
  planId: PremiumPlanId
}

export function CheckoutButton({ className, label, planId }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasImmediateAccessConsent, setHasImmediateAccessConsent] = useState(false)

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
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          immediateAccessConsent: hasImmediateAccessConsent,
          withdrawalWaiver: hasImmediateAccessConsent,
        }),
      })

      const payload = (await response.json()) as { error?: string; url?: string }

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Paiement indisponible pour le moment.")
      }

      trackClientEvent("checkout_redirected", { planId })
      window.location.href = payload.url
    } catch (caughtError) {
      reportClientError("checkout-button", caughtError, { planId })
      setError(caughtError instanceof Error ? caughtError.message : "Impossible de démarrer le paiement.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="flex items-start gap-3 rounded-[20px] border border-slate-200/80 bg-slate-50/80 p-3 text-sm leading-5 text-slate-600">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-700"
          checked={hasImmediateAccessConsent}
          onChange={(event) => setHasImmediateAccessConsent(event.currentTarget.checked)}
        />
        <span>
          J'accepte l'activation immédiate du service premium et je renonce à mon droit de rétractation une fois
          l'accès activé. Voir les{" "}
          <Link href="/cgv" className="font-medium text-sky-800 hover:underline">
            CGV
          </Link>
          .
        </span>
      </label>
      <button type="button" className={className} onClick={handleCheckout} disabled={isLoading}>
        {isLoading ? "Redirection..." : label}
      </button>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!siteConfig.launch.stripeEnabled && (
        <div className="text-xs text-slate-500">
          Le paiement reste à brancher avec vos identifiants Stripe avant lancement public.
        </div>
      )}
    </div>
  )
}
