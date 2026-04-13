import type { NextRequest } from "next/server"
import { track } from "@vercel/analytics/server"
import { COOKIE_CONSENT_COOKIE_NAME, isCookieConsentAccepted } from "@/lib/cookie-consent"
import { siteConfig } from "@/lib/site-config"

export async function trackServerEvent(
  request: NextRequest | null,
  eventName: string,
  data?: Record<string, string | number | boolean | null | undefined>,
) {
  try {
    if (siteConfig.compliance.optionalTrackersEnabled) {
      const consent = request?.cookies.get(COOKIE_CONSENT_COOKIE_NAME)?.value
      if (!isCookieConsentAccepted(consent)) {
        return
      }
    }

    await track(eventName, data)
  } catch (error) {
    console.warn("[label2a4-analytics]", error)
  }
}
