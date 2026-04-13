export const COOKIE_CONSENT_KEY = "label2a4-cookie-consent"
export const COOKIE_CONSENT_COOKIE_NAME = "label2a4_cookie_consent"
export const ANALYTICS_DISABLE_KEY = "va-disable"

export type CookieConsentStatus = "accepted" | "refused"

export function isCookieConsentAccepted(status?: string | null) {
  return status === "accepted"
}
