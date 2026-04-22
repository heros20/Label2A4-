"use client"

import { useEffect } from "react"
import {
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_UPDATED_EVENT,
  isCookieConsentAccepted,
} from "@/lib/cookie-consent"
import type { AccessSnapshot } from "@/lib/monetization-types"
import { siteConfig } from "@/lib/site-config"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"
import { isSupabaseAuthConfigured } from "@/lib/supabase/config"

const ADSENSE_SCRIPT_ID = "label2a4-adsense-script"
const ADSENSE_AUTO_AD_SELECTORS = [
  "ins.adsbygoogle",
  'iframe[id^="google_ads_iframe_"]',
  'iframe[src*="googlesyndication.com"]',
  'iframe[src*="doubleclick.net"]',
]

interface AccessResponsePayload {
  access?: AccessSnapshot
}

function hasAdsConsent() {
  try {
    const stored = window.localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!stored) {
      return false
    }

    const parsed = JSON.parse(stored) as { status?: string }
    return isCookieConsentAccepted(parsed.status)
  } catch {
    return false
  }
}

function injectAdsenseScript() {
  const adsenseClientId = siteConfig.compliance.adsenseClientId.trim()

  if (!adsenseClientId) {
    return
  }

  if (document.getElementById(ADSENSE_SCRIPT_ID)) {
    return
  }

  const script = document.createElement("script")
  script.id = ADSENSE_SCRIPT_ID
  script.async = true
  script.crossOrigin = "anonymous"
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClientId)}`

  document.head.appendChild(script)
}

function removeAdsenseScript() {
  document.getElementById(ADSENSE_SCRIPT_ID)?.remove()

  document.querySelectorAll(ADSENSE_AUTO_AD_SELECTORS.join(",")).forEach((node) => {
    node.remove()
  })
}

export function AdsenseManager() {
  useEffect(() => {
    if (!siteConfig.compliance.adsEnabled || !siteConfig.compliance.adsenseClientId.trim()) {
      return
    }

    let isCancelled = false

    const syncAdsenseForCurrentAccess = async () => {
      if (!hasAdsConsent()) {
        removeAdsenseScript()
        return
      }

      try {
        const response = await fetch("/api/access", {
          cache: "no-store",
          credentials: "same-origin",
        })

        if (!response.ok || isCancelled) {
          return
        }

        const payload = (await response.json()) as AccessResponsePayload

        if (payload.access?.isPremium) {
          removeAdsenseScript()
        } else {
          injectAdsenseScript()
        }
      } catch (error) {
        console.warn("[label2a4-adsense]", error)
      }
    }

    const syncAdsenseWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void syncAdsenseForCurrentAccess()
      }
    }

    const authSubscription = isSupabaseAuthConfigured()
      ? getSupabaseBrowserClient().auth.onAuthStateChange(() => {
          void syncAdsenseForCurrentAccess()
        }).data.subscription
      : null

    void syncAdsenseForCurrentAccess()
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, syncAdsenseForCurrentAccess)
    window.addEventListener("focus", syncAdsenseForCurrentAccess)
    document.addEventListener("visibilitychange", syncAdsenseWhenVisible)

    return () => {
      isCancelled = true
      authSubscription?.unsubscribe()
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, syncAdsenseForCurrentAccess)
      window.removeEventListener("focus", syncAdsenseForCurrentAccess)
      document.removeEventListener("visibilitychange", syncAdsenseWhenVisible)
    }
  }, [])

  return null
}
