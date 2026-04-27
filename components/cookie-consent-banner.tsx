"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { Locale } from "@/lib/i18n"
import {
  ANALYTICS_DISABLE_KEY,
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_UPDATED_EVENT,
  type CookieConsentStatus,
} from "@/lib/cookie-consent"
import { localizePath } from "@/lib/i18n"
import { siteConfig } from "@/lib/site-config"

export function CookieConsentBanner({ locale }: { locale: Locale }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!siteConfig.compliance.adsEnabled && !siteConfig.compliance.optionalTrackersEnabled) {
      return
    }

    const stored = window.localStorage.getItem(COOKIE_CONSENT_KEY)
    setIsVisible(!stored)
  }, [])

  const saveConsent = (status: CookieConsentStatus) => {
    window.localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        status,
        updatedAt: new Date().toISOString(),
      }),
    )
    document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${status}; path=/; max-age=31536000; SameSite=Lax`

    if (status === "accepted") {
      window.localStorage.removeItem(ANALYTICS_DISABLE_KEY)
    } else {
      window.localStorage.setItem(ANALYTICS_DISABLE_KEY, "1")
    }

    window.dispatchEvent(new Event(COOKIE_CONSENT_UPDATED_EVENT))
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 mx-auto w-full max-w-4xl rounded-[24px] border border-white/70 bg-slate-950/95 p-4 text-white shadow-[0_28px_70px_-30px_rgba(15,23,42,0.86)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">
            {locale === "en" ? "Ads and analytics" : "Publicité et mesure d’audience"}
          </div>
          <p className="mt-2 text-sm leading-6 text-white/85">
            {locale === "en"
              ? "The free version may display ads and use analytics to measure visits and commercial performance. You can accept or refuse these optional trackers."
              : "La version gratuite peut afficher des annonces et utiliser une mesure d’audience pour suivre les visites et les performances commerciales. Vous pouvez accepter ou refuser ces traceurs facultatifs."}{" "}
            <Link href={localizePath("/cookies", locale)} className="font-medium text-sky-200 hover:underline">
              {locale === "en" ? "Learn more" : "En savoir plus"}
            </Link>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white"
            onClick={() => saveConsent("refused")}
          >
            {locale === "en" ? "Reject" : "Refuser"}
          </button>
          <button
            type="button"
            className="rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950"
            onClick={() => saveConsent("accepted")}
          >
            {locale === "en" ? "Accept" : "Accepter"}
          </button>
        </div>
      </div>
    </div>
  )
}
