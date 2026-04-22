export const ADSENSE_SCRIPT_ID = "label2a4-adsense-script"
export const ADSENSE_SCRIPT_BASE_URL = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
export const ADSENSE_AUTHORITY_ID = "f08c47fec0942fa0"

export function getAdsenseScriptUrl(clientId: string) {
  const trimmedClientId = clientId.trim()

  if (!trimmedClientId) {
    return ""
  }

  return `${ADSENSE_SCRIPT_BASE_URL}?client=${encodeURIComponent(trimmedClientId)}`
}
