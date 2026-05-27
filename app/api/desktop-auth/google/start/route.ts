import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseAuthConfigured } from "@/lib/supabase/config"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json({ error: "Authentification non configurée." }, { status: 503 })
  }

  const origin = new URL(request.url).origin
  const supabase = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  })

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

  return NextResponse.json({ authUrl: data.url })
}