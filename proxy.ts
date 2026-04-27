import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import {
  DEFAULT_LOCALE,
  LOCALE_HEADER_NAME,
  PREFERRED_LOCALE_COOKIE_NAME,
  isLocale,
  localizePath,
  stripLocalePrefix,
  type Locale,
} from "@/lib/i18n"
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseAuthConfigured } from "@/lib/supabase/config"

function getSafeNextPath(request: NextRequest) {
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`
  return nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/compte"
}

function resolveLocale(request: NextRequest): Locale {
  const { pathname } = request.nextUrl

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return "en"
  }

  if (pathname.startsWith("/api/")) {
    const cookieLocale = request.cookies.get(PREFERRED_LOCALE_COOKIE_NAME)?.value
    return isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE
  }

  return DEFAULT_LOCALE
}

function isProtectedAccountPath(request: NextRequest) {
  return stripLocalePrefix(request.nextUrl.pathname) === "/compte"
}

export async function proxy(request: NextRequest) {
  const locale = resolveLocale(request)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(LOCALE_HEADER_NAME, locale)

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  if (!request.nextUrl.pathname.startsWith("/api/")) {
    response.cookies.set(PREFERRED_LOCALE_COOKIE_NAME, locale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    })
  }

  if (!isProtectedAccountPath(request) || !isSupabaseAuthConfigured()) {
    return response
  }

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
        response.cookies.set(PREFERRED_LOCALE_COOKIE_NAME, locale, {
          maxAge: 60 * 60 * 24 * 365,
          path: "/",
          sameSite: "lax",
        })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return response
  }

  const redirectUrl = new URL(localizePath("/connexion", locale), request.url)
  redirectUrl.searchParams.set("next", getSafeNextPath(request))
  const redirectResponse = NextResponse.redirect(redirectUrl)

  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie))
  redirectResponse.cookies.set(PREFERRED_LOCALE_COOKIE_NAME, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  })

  return redirectResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|webp|svg|ico|css|js|map|txt|xml)$).*)",
  ],
}
