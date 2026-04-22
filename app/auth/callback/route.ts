import type { EmailOtpType } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { createRouteSupabaseClient } from "@/lib/supabase/route"

export const runtime = "nodejs"

function getSafeRedirectPath(request: NextRequest) {
  const nextPath = request.nextUrl.searchParams.get("next")
  return nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/compte"
}

export async function GET(request: NextRequest) {
  const responseDraft = new NextResponse()
  const redirectUrl = new URL(getSafeRedirectPath(request), request.url)

  try {
    const supabase = createRouteSupabaseClient(request, responseDraft)
    const code = request.nextUrl.searchParams.get("code")
    const tokenHash = request.nextUrl.searchParams.get("token_hash")
    const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        throw error
      }
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      })
      if (error) {
        throw error
      }
    } else {
      redirectUrl.searchParams.set("auth_error", "missing_token")
    }
  } catch (error) {
    console.error("[label2a4-auth-callback]", error)
    redirectUrl.searchParams.set("auth_error", "callback_failed")
  }

  const response = NextResponse.redirect(redirectUrl)
  responseDraft.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
  return response
}
