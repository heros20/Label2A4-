import { createHmac } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { resolveStoredPlanStateForUser } from "@/lib/billing-store"
import { consumeRateLimit } from "@/lib/rate-limit"
import { getRequestLocaleFromRequest } from "@/lib/request-locale"
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isSupabaseAuthConfigured,
} from "@/lib/supabase/config"

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
  const payload = base64UrlEncode(
    JSON.stringify({
      v: 1,
      userId: input.userId,
      email: input.email ?? null,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
    }),
  )

  return `${payload}.${signPayload(payload)}`
}

function cleanEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 180) : ""
}

function isAdminPremiumEmail(email?: string | null) {
  if (!email) {
    return false
  }

  return (process.env.ADMIN_PREMIUM_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase())
}

export async function POST(request: NextRequest) {
  const locale = getRequestLocaleFromRequest(request)

  try {
    const rateLimit = await consumeRateLimit(request, {
      bucket: "desktop-auth-login",
      limit: 20,
      windowSeconds: 10 * 60,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: locale === "en" ? "Too many login attempts." : "Trop de tentatives de connexion." },
        { status: 429 },
      )
    }

    if (!isSupabaseAuthConfigured()) {
      return NextResponse.json(
        { error: locale === "en" ? "Authentication is not configured." : "Authentification non configurée." },
        { status: 503 },
      )
    }

    const payload = (await request.json()) as { email?: unknown; password?: unknown }
    const email = cleanEmail(payload.email)
    const password = typeof payload.password === "string" ? payload.password : ""

    if (!email || !password) {
      return NextResponse.json(
        { error: locale === "en" ? "Email and password are required." : "Email et mot de passe requis." },
        { status: 400 },
      )
    }

    const supabase = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      return NextResponse.json(
        { error: locale === "en" ? "Invalid login credentials." : "Identifiants invalides." },
        { status: 401 },
      )
    }

    if (isAdminPremiumEmail(data.user.email)) {
      return NextResponse.json({
        email: data.user.email,
        expiresAt: null,
        isPremium: true,
        plan: "annual",
        subscriptionStatus: "admin",
        token: createDesktopToken({
          userId: data.user.id,
          email: data.user.email,
        }),
      })
    }

    const planState = await resolveStoredPlanStateForUser(data.user.id)

    if (!planState.isPremium) {
      return NextResponse.json(
        {
          email: data.user.email,
          expiresAt: planState.expiresAt ?? null,
          isPremium: false,
          plan: planState.plan,
        },
        { status: 403 },
      )
    }

    return NextResponse.json({
      email: data.user.email,
      expiresAt: planState.expiresAt ?? null,
      isPremium: true,
      plan: planState.plan,
      subscriptionStatus: planState.subscriptionStatus ?? null,
      token: createDesktopToken({
        userId: data.user.id,
        email: data.user.email,
      }),
    })
  } catch (error) {
    console.error("[label2a4-desktop-auth-login]", error)

    return NextResponse.json(
      { error: locale === "en" ? "Unable to sign in." : "Connexion impossible." },
      { status: 500 },
    )
  }
}