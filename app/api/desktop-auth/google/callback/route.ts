import { createHmac } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { resolveStoredPlanStateForUser } from "@/lib/billing-store"
import { createRouteSupabaseClient } from "@/lib/supabase/route"
import { isSupabaseAuthConfigured } from "@/lib/supabase/config"

export const runtime = "nodejs"

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30

function getDesktopAuthSecret() {
  return process.env.DESKTOP_AUTH_SIGNING_SECRET ?? process.env.QUOTA_SIGNING_SECRET ?? "label2a4-dev-secret"
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url")
}

function signPayload(payload: string) {
  return createHmac("sha256", getDesktopAuthSecret()).update(payload).digest("base64url")
}

function createDesktopToken(input: { userId: string; email?: string | null }) {
  const now = Math.floor(Date.now() / 1000)
  const payload = base64UrlEncode(JSON.stringify({
    v: 1,
    userId: input.userId,
    email: input.email ?? null,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  }))

  return `${payload}.${signPayload(payload)}`
}

function isAdminPremiumEmail(email?: string | null) {
  return Boolean(
    email &&
      (process.env.ADMIN_PREMIUM_EMAILS ?? "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
        .includes(email.toLowerCase()),
  )
}

function redirectToDesktopResult(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/desktop-auth/complete", new URL(request.url).origin)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseAuthConfigured()) {
      return redirectToDesktopResult(request, { desktopError: "Authentification non configurée." })
    }

    const code = new URL(request.url).searchParams.get("code")
    if (!code) {
      return redirectToDesktopResult(request, { desktopError: "Code Google manquant." })
    }

    const cookieDraft = new NextResponse()
    const supabase = createRouteSupabaseClient(request, cookieDraft)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.user) {
      return redirectToDesktopResult(request, { desktopError: "Connexion Google impossible." })
    }

    if (isAdminPremiumEmail(data.user.email)) {
      return redirectToDesktopResult(request, {
        desktopToken: createDesktopToken({ userId: data.user.id, email: data.user.email }),
      })
    }

    const planState = await resolveStoredPlanStateForUser(data.user.id)

    if (!planState.isPremium) {
      return redirectToDesktopResult(request, {
        desktopError: "Ce compte n'a pas d'abonnement premium actif.",
      })
    }

    return redirectToDesktopResult(request, {
      desktopToken: createDesktopToken({ userId: data.user.id, email: data.user.email }),
    })
  } catch (error) {
    console.error("[label2a4-desktop-google-callback]", error)
    return redirectToDesktopResult(request, { desktopError: "Connexion Google impossible." })
  }
}