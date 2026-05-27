import { createHmac, timingSafeEqual } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { resolveStoredPlanStateForUser } from "@/lib/billing-store"
import { getRequestLocaleFromRequest } from "@/lib/request-locale"

export const runtime = "nodejs"

interface DesktopTokenPayload {
  v: 1
  userId: string
  email?: string | null
  iat: number
  exp: number
}

function getDesktopAuthSecret() {
  return process.env.DESKTOP_AUTH_SIGNING_SECRET ?? process.env.QUOTA_SIGNING_SECRET ?? "label2a4-dev-secret"
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function signPayload(payload: string) {
  return createHmac("sha256", getDesktopAuthSecret()).update(payload).digest("base64url")
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)

  return left.length === right.length && timingSafeEqual(left, right)
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? ""

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return ""
  }

  return authorization.slice(7).trim()
}

function verifyDesktopToken(token: string): DesktopTokenPayload | null {
  const [payload, signature] = token.split(".")

  if (!payload || !signature || !safeEqual(signature, signPayload(payload))) {
    return null
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(payload)) as DesktopTokenPayload

    if (decoded.v !== 1 || !decoded.userId || !decoded.exp) {
      return null
    }

    if (decoded.exp <= Math.floor(Date.now() / 1000)) {
      return null
    }

    return decoded
  } catch {
    return null
  }
}

async function handleSession(request: NextRequest) {
  const locale = getRequestLocaleFromRequest(request)

  try {
    const tokenPayload = verifyDesktopToken(getBearerToken(request))

    if (!tokenPayload) {
      return NextResponse.json(
        { error: locale === "en" ? "Invalid desktop session." : "Session bureau invalide." },
        { status: 401 },
      )
    }

    const planState = await resolveStoredPlanStateForUser(tokenPayload.userId)

    return NextResponse.json({
      email: planState.email ?? tokenPayload.email ?? null,
      expiresAt: planState.expiresAt ?? null,
      isPremium: planState.isPremium,
      plan: planState.plan,
      subscriptionStatus: planState.subscriptionStatus ?? null,
    })
  } catch (error) {
    console.error("[label2a4-desktop-auth-session]", error)

    return NextResponse.json(
      { error: locale === "en" ? "Unable to verify desktop session." : "Vérification de session impossible." },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  return handleSession(request)
}

export async function POST(request: NextRequest) {
  return handleSession(request)
}