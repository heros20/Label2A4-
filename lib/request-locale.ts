import { cookies, headers } from "next/headers"
import {
  DEFAULT_LOCALE,
  LOCALE_HEADER_NAME,
  PREFERRED_LOCALE_COOKIE_NAME,
  isLocale,
  type Locale,
} from "@/lib/i18n"

export async function getRequestLocale(): Promise<Locale> {
  const headerStore = await headers()
  const headerLocale = headerStore.get(LOCALE_HEADER_NAME)

  if (isLocale(headerLocale)) {
    return headerLocale
  }

  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(PREFERRED_LOCALE_COOKIE_NAME)?.value

  return isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE
}

interface RequestLikeWithLocale {
  cookies?: {
    get(name: string): { value?: string } | undefined
  }
  headers: Headers
}

export function getRequestLocaleFromRequest(request: RequestLikeWithLocale): Locale {
  const headerLocale = request.headers.get(LOCALE_HEADER_NAME)

  if (isLocale(headerLocale)) {
    return headerLocale
  }

  const cookieLocale = request.cookies?.get(PREFERRED_LOCALE_COOKIE_NAME)?.value
  return isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE
}
