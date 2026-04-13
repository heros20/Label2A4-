"use client"

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next"
import { ANALYTICS_DISABLE_KEY, COOKIE_CONSENT_KEY } from "@/lib/cookie-consent"
import { siteConfig } from "@/lib/site-config"

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

function sanitizeAnalyticsEvent(event: BeforeSendEvent) {
  if (!hasAnalyticsConsent()) {
    return null
  }

  try {
    const url = new URL(event.url)

    if (url.pathname.startsWith("/admin")) {
      return null
    }

    url.search = ""

    return {
      ...event,
      url: url.toString(),
    }
  } catch {
    return event
  }
}

export function SiteAnalytics() {
  return <Analytics beforeSend={sanitizeAnalyticsEvent} />
}
