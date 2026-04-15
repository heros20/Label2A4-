import { createServerClient } from "@supabase/ssr"
import { type NextRequest, type NextResponse } from "next/server"
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseAuthConfigured } from "@/lib/supabase/config"

export function createRouteSupabaseClient(request: NextRequest, response: NextResponse) {
  if (!isSupabaseAuthConfigured()) {
    throw new Error("Supabase auth client is not configured.")
  }

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })
}
