import { NextRequest, NextResponse } from "next/server"
import { createRouteSupabaseClient } from "@/lib/supabase/route"
import { isSupabaseAuthConfigured } from "@/lib/supabase/config"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json({ error: "Authentification non configurée." }, { status: 503 })
  }

  const origin = new URL(request.url).origin
  const cookieDraft = new NextResponse()
  const supabase = createRouteSupabaseClient(request, cookieDraft)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/api/desktop-auth/google/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  })

  if (error || !data.url) {
    return NextResponse.json({ error: "Connexion Google indisponible." }, { status: 500 })
  }

  const response = NextResponse.redirect(data.url)
  cookieDraft.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
  return response
}