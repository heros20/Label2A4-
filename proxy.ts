import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseAuthConfigured } from "@/lib/supabase/config"

function getSafeNextPath(request: NextRequest) {
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`
  return nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/compte"
}

export async function proxy(request: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request,
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

  const redirectUrl = new URL("/connexion", request.url)
  redirectUrl.searchParams.set("next", getSafeNextPath(request))
  const redirectResponse = NextResponse.redirect(redirectUrl)

  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie))

  return redirectResponse
}

export const config = {
  matcher: ["/compte/:path*"],
}
