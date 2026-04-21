import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { getRequestOrigin } from "@/lib/access-control"
import { sendBrevoTransactionalEmail } from "@/lib/brevo"
import { consumeRateLimit } from "@/lib/rate-limit"
import { siteConfig } from "@/lib/site-config"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { isSupabaseAdminConfigured } from "@/lib/supabase/config"

export const runtime = "nodejs"

interface MagicLinkPayload {
  email?: unknown
  redirectTo?: unknown
}

function cleanEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 180) : ""
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function hashEmail(email: string) {
  return createHash("sha256").update(email).digest("hex").slice(0, 16)
}

function resolveRedirectTo(request: NextRequest, value: unknown) {
  const origin = getRequestOrigin(request)
  const fallback = new URL("/auth/callback?next=/compte", origin)

  if (typeof value !== "string" || !value.trim()) {
    return fallback.toString()
  }

  try {
    const redirectUrl = new URL(value, origin)

    if (redirectUrl.origin !== origin || redirectUrl.pathname !== "/auth/callback") {
      return fallback.toString()
    }

    const nextPath = redirectUrl.searchParams.get("next")
    if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
      redirectUrl.searchParams.set("next", "/compte")
    }

    return redirectUrl.toString()
  } catch {
    return fallback.toString()
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await consumeRateLimit(request, {
      bucket: "auth-magic-link",
      limit: 5,
      windowSeconds: 10 * 60,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de demandes de connexion. Reessayez dans quelques minutes." },
        { status: 429 },
      )
    }

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({ error: "Supabase Admin n'est pas configure." }, { status: 503 })
    }

    const payload = (await request.json()) as MagicLinkPayload
    const email = cleanEmail(payload.email)

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 })
    }

    const redirectTo = resolveRedirectTo(request, payload.redirectTo)
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase.auth.admin.generateLink({
      email,
      options: {
        redirectTo,
      },
      type: "magiclink",
    })

    if (error) {
      throw new Error(error.message)
    }

    const actionLink = data.properties?.action_link
    if (!actionLink) {
      throw new Error("Supabase did not return an auth action link.")
    }

    const subject = `Connexion a ${siteConfig.siteName}`
    const textContent = [
      `Bonjour,`,
      "",
      `Cliquez sur ce lien pour vous connecter ou creer votre compte ${siteConfig.siteName} :`,
      actionLink,
      "",
      "Si vous n'etes pas a l'origine de cette demande, ignorez cet email.",
    ].join("\n")
    const htmlContent = `
      <h2>Connexion a ${escapeHtml(siteConfig.siteName)}</h2>
      <p>Cliquez sur le bouton ci-dessous pour vous connecter ou creer votre compte.</p>
      <p>
        <a href="${escapeHtml(actionLink)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">
          Ouvrir mon compte
        </a>
      </p>
      <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
      <p><a href="${escapeHtml(actionLink)}">${escapeHtml(actionLink)}</a></p>
      <p>Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>
    `

    const brevoResponse = await sendBrevoTransactionalEmail({
      htmlContent,
      subject,
      textContent,
      to: [{ email }],
    })

    console.info("[label2a4-auth-magic-link-sent]", {
      emailHash: hashEmail(email),
      messageId: brevoResponse.messageId ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[label2a4-auth-magic-link]", error)
    return NextResponse.json({ error: "Impossible d'envoyer le lien de connexion." }, { status: 500 })
  }
}
