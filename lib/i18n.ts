export const LOCALES = ["fr", "en"] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "fr"
export const PREFERRED_LOCALE_COOKIE_NAME = "label2a4-locale"
export const LOCALE_HEADER_NAME = "x-label2a4-locale"

function splitPathParts(value: string) {
  const hashIndex = value.indexOf("#")
  const hash = hashIndex >= 0 ? value.slice(hashIndex) : ""
  const withoutHash = hashIndex >= 0 ? value.slice(0, hashIndex) : value
  const queryIndex = withoutHash.indexOf("?")
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex) : ""
  const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash

  return {
    hash,
    pathname,
    query,
  }
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "fr" || value === "en"
}

export function getOpenGraphLocale(locale: Locale) {
  return locale === "en" ? "en_US" : "fr_FR"
}

export function getLocalePrefix(locale: Locale) {
  return locale === "en" ? "/en" : ""
}

export function stripLocalePrefix(path: string) {
  const { hash, pathname, query } = splitPathParts(path)

  if (pathname === "/en") {
    return `/${query}${hash}`.replace("//", "/")
  }

  if (pathname.startsWith("/en/")) {
    return `${pathname.slice(3)}${query}${hash}`
  }

  return `${pathname || "/"}${query}${hash}`
}

export function getPathLocale(path: string): Locale {
  const { pathname } = splitPathParts(path)
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "fr"
}

export function localizePath(path: string, locale: Locale) {
  if (!path || path.startsWith("http://") || path.startsWith("https://") || path.startsWith("mailto:")) {
    return path
  }

  const { hash, pathname, query } = splitPathParts(stripLocalePrefix(path))
  const normalizedPathname = pathname || "/"
  const prefix = getLocalePrefix(locale)

  if (normalizedPathname === "/") {
    return `${prefix || "/"}${query}${hash}`
  }

  return `${prefix}${normalizedPathname}${query}${hash}`
}

export function getAlternateLocalePath(path: string, targetLocale: Locale) {
  return localizePath(path, targetLocale)
}

export function getRoutePathFromSegments(segments?: string[]) {
  if (!segments || segments.length === 0) {
    return "/"
  }

  return `/${segments.join("/")}`
}

export function getLocaleHrefLang(locale: Locale) {
  return locale
}
