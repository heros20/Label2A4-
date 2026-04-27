"use client"

import { useState } from "react"
import type { Locale } from "@/lib/i18n"
import { trackClientEvent } from "@/lib/client-analytics"
import { reportClientError } from "@/lib/client-monitoring"

interface BillingPortalButtonProps {
  className?: string
  label?: string
  locale: Locale
}

export function BillingPortalButton({
  className,
  label,
  locale,
}: BillingPortalButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleClick = async () => {
    setIsLoading(true)
    setError("")
    trackClientEvent("billing_portal_clicked", {
      path: window.location.pathname,
    })

    try {
      const response = await fetch("/api/billing-portal")
      const payload = (await response.json()) as { error?: string; url?: string }

      if (!response.ok || !payload.url) {
        throw new Error(
          payload.error ??
            (locale === "en"
              ? "Unable to open the billing portal."
              : "Impossible d'ouvrir le portail de résiliation."),
        )
      }

      trackClientEvent("billing_portal_redirected")
      window.location.href = payload.url
    } catch (caughtError) {
      reportClientError("billing-portal-button", caughtError)
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : locale === "en"
            ? "Billing portal unavailable."
            : "Portail de résiliation indisponible.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" className={className} onClick={handleClick} disabled={isLoading}>
        {isLoading
          ? locale === "en"
            ? "Opening..."
            : "Ouverture..."
          : label ?? (locale === "en" ? "Manage my subscription" : "Gérer mon abonnement")}
      </button>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  )
}
