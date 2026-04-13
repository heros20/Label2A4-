"use client"

import { track } from "@vercel/analytics"
import { ANALYTICS_DISABLE_KEY, COOKIE_CONSENT_KEY } from "@/lib/cookie-consent"
import { siteConfig } from "@/lib/site-config"

type ClientAnalyticsValue = string | number | boolean | null | undefined

export type ClientAnalyticsPayload = Record<string, ClientAnalyticsValue>

function hasAnalyticsConsent() {
  if (!siteConfig.compliance.optionalTrackersEnabled) {
    return true
  }

  try {
    if (window.localStorage.getItem(ANALYTICS_DISABLE_KEY)) {
      return false
    }

    const stored = window.localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!stored) {
      return false
    }

    const parsed = JSON.parse(stored) as { status?: string }
    return parsed.status === "accepted"
  } catch {
    return false
  }
}

export function trackClientEvent(eventName: string, payload?: ClientAnalyticsPayload) {
  if (!hasAnalyticsConsent()) {
    return
  }

  track(eventName, payload)
}
