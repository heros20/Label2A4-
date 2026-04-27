import { createHash } from "crypto"
import type { User } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { getRequestOrigin } from "@/lib/access-control"
import { sendBrevoTransactionalEmail } from "@/lib/brevo"
import { localizePath, type Locale } from "@/lib/i18n"
import { getRequestLocaleFromRequest } from "@/lib/request-locale"
import { consumeRateLimit } from "@/lib/rate-limit"
import { siteConfig } from "@/lib/site-config"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { isSupabaseAdminConfigured } from "@/lib/supabase/config"

export const runtime = "nodejs"

interface MagicLinkPayload {
  email?: unknown
  mode?: unknown
  redirectTo?: unknown
}

type MagicLinkMode = "sign-in" | "sign-up"

function cleanEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 180) : ""
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getMagicLinkMode(value: unknown): MagicLinkMode {
  return value === "sign-up" ? "sign-up" : "sign-in"
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

function resolveRedirectTo(request: NextRequest, value: unknown, locale: Locale) {
  const origin = getRequestOrigin(request)
  const fallback = new URL(
    `/auth/callback?next=${encodeURIComponent(localizePath("/compte", locale))}`,
    origin,
  )

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
      redirectUrl.searchParams.set("next", localizePath("/compte", locale))
    }

    return redirectUrl.toString()
  } catch {
    return fallback.toString()
  }
}

function getSafeNextPathFromRedirectTo(redirectTo: string, locale: Locale) {
  try {
    const redirectUrl = new URL(redirectTo)
    const nextPath = redirectUrl.searchParams.get("next")

    return nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : localizePath("/compte", locale)
  } catch {
    return localizePath("/compte", locale)
  }
}

function withRedirectNextPath(redirectTo: string, nextPath: string) {
  const redirectUrl = new URL(redirectTo)
  redirectUrl.searchParams.set("next", nextPath)
  return redirectUrl.toString()
}

function buildPasswordSetupPath(returnTo: string, locale: Locale) {
  const passwordSetupUrl = new URL(localizePath("/auth/reset-password", locale), "https://label2a4.local")
  passwordSetupUrl.searchParams.set("status", "first-login")
  passwordSetupUrl.searchParams.set("next", returnTo)
  return `${passwordSetupUrl.pathname}${passwordSetupUrl.search}`
}

function buildServerVerifiedConfirmationUrl(input: {
  locale: Locale
  request: NextRequest
  redirectTo: string
  tokenHash: string
  type: string
}) {
  const confirmationUrl = new URL("/auth/callback", getRequestOrigin(input.request))
  confirmationUrl.searchParams.set("token_hash", input.tokenHash)
  confirmationUrl.searchParams.set("type", input.type)
  confirmationUrl.searchParams.set("next", getSafeNextPathFromRedirectTo(input.redirectTo, input.locale))
  return confirmationUrl.toString()
}

function getMagicLinkCopy(locale: Locale, requiresPasswordSetup: boolean) {
  if (locale === "en") {
    return {
      bodyText: "This link verifies your email address and signs you in to <strong>Label2A4</strong>. It is personal and only valid for a limited time.",
      buttonLabel: requiresPasswordSetup ? "Create my password" : "Open my account",
      ctaIntro: requiresPasswordSetup
        ? "Click the button below to verify your email address, then set your Label2A4 password."
        : "Click the button below to continue to your account and use your label optimization tool.",
      heading: "Access your Label2A4 account",
      hiddenPreview: "Your Label2A4 access link is ready.",
      linkIntro: "If the button does not work, copy and paste this link into your browser:",
      readyLine: "Your access link is ready.",
      signature: "Label2A4 - Cleaner labels, optimized sheets.",
      textAction: requiresPasswordSetup
        ? "Click this link to verify your email address and create your password:"
        : "Click this link to verify your email address and open your account:",
      textGreeting: "Hello,",
      textHeadline: "Your Label2A4 access link is ready.",
      textIgnore: "Did not request this link? Ignore this email and nothing will happen.",
      valueProp:
        "With Label2A4, you group shipping labels on one A4 sheet to print more cleanly, faster and with less waste.",
    }
  }

  return {
    bodyText: "Ce lien permet de verifier ton adresse email et de te connecter a <strong>Label2A4</strong>. Il est personnel et valable uniquement pendant une duree limitee.",
    buttonLabel: requiresPasswordSetup ? "Creer mon mot de passe" : "Ouvrir mon espace",
    ctaIntro: requiresPasswordSetup
      ? "Clique sur le bouton ci-dessous pour verifier ton adresse email, puis definir ton mot de passe Label2A4."
      : "Clique sur le bouton ci-dessous pour continuer vers ton espace et utiliser ton outil d'optimisation d'etiquettes.",
    heading: "Accede a ton espace Label2A4",
    hiddenPreview: "Ton lien d'acces Label2A4 est pret.",
    linkIntro: "Si le bouton ne fonctionne pas, copie-colle ce lien dans ton navigateur :",
    readyLine: "Ton lien d'acces est pret.",
    signature: "Label2A4 - Des etiquettes propres, des feuilles optimisees.",
    textAction: requiresPasswordSetup
      ? "Clique sur ce lien pour verifier ton adresse email et creer ton mot de passe :"
      : "Clique sur ce lien pour verifier ton adresse email et ouvrir ton espace :",
    textGreeting: "Bonjour,",
    textHeadline: "Ton lien d'acces Label2A4 est pret.",
    textIgnore: "Tu n'as pas demande ce lien ? Ignore cet email, aucune action ne sera effectuee.",
    valueProp:
      "Avec Label2A4, tu regroupes tes etiquettes sur une feuille A4 pour imprimer plus proprement, plus vite, et avec moins de gaspillage.",
  }
}

function buildMagicLinkTextContent(input: {
  confirmationUrl: string
  locale: Locale
  requiresPasswordSetup: boolean
}) {
  const copy = getMagicLinkCopy(input.locale, input.requiresPasswordSetup)

  return [
    copy.textGreeting,
    "",
    copy.textHeadline,
    "",
    copy.textAction,
    input.confirmationUrl,
    "",
    copy.valueProp,
    "",
    copy.textIgnore,
    "",
    copy.signature,
  ].join("\n")
}

function buildMagicLinkHtmlContent(input: {
  confirmationUrl: string
  locale: Locale
  requiresPasswordSetup: boolean
}) {
  const copy = getMagicLinkCopy(input.locale, input.requiresPasswordSetup)
  const escapedConfirmationUrl = escapeHtml(input.confirmationUrl)

  return `
<div style="margin:0;padding:0;background:#edf3f8;font-family:Segoe UI,Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${copy.hiddenPreview}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#edf3f8;margin:0;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #d6e2ee;box-shadow:0 18px 45px rgba(15,23,42,0.10);">
          <tr>
            <td style="padding:30px 30px 24px 30px;background:#f8fbfd;background:linear-gradient(135deg,#f8fbfd 0%,#e8f0f6 52%,#dbeafe 100%);border-bottom:1px solid #d6e2ee;">
              <div style="display:inline-block;padding:7px 11px;border-radius:999px;background:#ffffff;border:1px solid #d6e2ee;color:#0369a1;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">
                Label2A4
              </div>

              <h1 style="margin:18px 0 0 0;font-size:28px;line-height:1.2;color:#0f172a;font-weight:800;">
                ${copy.heading}
              </h1>

              <p style="margin:12px 0 0 0;font-size:15px;line-height:1.7;color:#526072;">
                ${escapeHtml(copy.ctaIntro)}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:30px 30px 8px 30px;">
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#0f172a;">
                ${copy.readyLine}
              </p>

              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.7;color:#526072;">
                ${copy.bodyText}
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0 28px 0;">
                <tr>
                  <td align="center" style="border-radius:14px;background:#0369a1;box-shadow:0 10px 24px rgba(3,105,161,0.28);">
                    <a href="${escapedConfirmationUrl}" style="display:inline-block;padding:15px 24px;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:14px;">
                      ${escapeHtml(copy.buttonLabel)}
                    </a>
                  </td>
                </tr>
              </table>

              <div style="padding:17px 18px;background:#f8fbfd;border:1px solid #d6e2ee;border-left:4px solid #f59e0b;border-radius:16px;margin:0 0 24px 0;">
                <p style="margin:0;font-size:14px;line-height:1.65;color:#526072;">
                  ${copy.valueProp}
                </p>
              </div>

              <p style="margin:0 0 10px 0;font-size:13px;line-height:1.6;color:#526072;">
                ${copy.linkIntro}
              </p>

              <p style="margin:0 0 22px 0;font-size:12px;line-height:1.6;word-break:break-all;color:#64748b;">
                <a href="${escapedConfirmationUrl}" style="color:#0369a1;text-decoration:underline;">${escapedConfirmationUrl}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 30px 30px 30px;">
              <hr style="border:none;border-top:1px solid #d6e2ee;margin:0 0 18px 0;" />

              <p style="margin:0 0 8px 0;font-size:13px;line-height:1.6;color:#526072;">
                ${copy.textIgnore}
              </p>

              <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
                ${copy.signature}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`
}

async function findExistingAuthUserByEmail(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  email: string,
) {
  const normalizedEmail = email.toLowerCase()
  const perPage = 1000
  const maxPages = 20

  for (let page = 1; page <= maxPages; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw new Error(`Unable to inspect auth users: ${error.message}`)
    }

    if (data.users.some((user) => user.email?.toLowerCase() === normalizedEmail)) {
      return true
    }

    if (!data.nextPage || data.users.length === 0) {
      return false
    }
  }

  console.warn("[label2a4-auth-magic-link-user-lookup-truncated]", {
    emailHash: hashEmail(email),
    maxPages,
    perPage,
  })
  return null
}

function wasUserLikelyCreatedByThisLink(user: Pick<User, "created_at" | "last_sign_in_at">) {
  const createdAt = Date.parse(user.created_at ?? "")

  if (!Number.isFinite(createdAt) || user.last_sign_in_at) {
    return false
  }

  return Math.abs(Date.now() - createdAt) < 60_000
}

export async function POST(request: NextRequest) {
  const locale = getRequestLocaleFromRequest(request)

  try {
    const rateLimit = await consumeRateLimit(request, {
      bucket: "auth-magic-link",
      limit: 5,
      windowSeconds: 10 * 60,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error:
            locale === "en"
              ? "Too many sign-in link requests. Please try again in a few minutes."
              : "Trop de demandes de connexion. Réessayez dans quelques minutes.",
        },
        { status: 429 },
      )
    }

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        {
          error:
            locale === "en"
              ? "Magic link sign-in is currently unavailable."
              : "Connexion par lien indisponible pour le moment.",
        },
        { status: 503 },
      )
    }

    const payload = (await request.json()) as MagicLinkPayload
    const email = cleanEmail(payload.email)
    const mode = getMagicLinkMode(payload.mode)

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: locale === "en" ? "Invalid email." : "Email invalide." }, { status: 400 })
    }

    const redirectTo = resolveRedirectTo(request, payload.redirectTo, locale)
    const supabase = getSupabaseAdminClient()
    const userExistedBeforeLink = await findExistingAuthUserByEmail(supabase, email)
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

    const tokenHash = data.properties?.hashed_token
    const verificationType = data.properties?.verification_type
    if (!tokenHash || !verificationType) {
      throw new Error("Supabase did not return an auth token hash.")
    }

    const requiresPasswordSetup =
      mode === "sign-up" ||
      userExistedBeforeLink === false ||
      (userExistedBeforeLink === null && wasUserLikelyCreatedByThisLink(data.user))
    const returnTo = getSafeNextPathFromRedirectTo(redirectTo, locale)
    const verifiedRedirectTo = requiresPasswordSetup
      ? withRedirectNextPath(redirectTo, buildPasswordSetupPath(returnTo, locale))
      : redirectTo
    const confirmationUrl = buildServerVerifiedConfirmationUrl({
      locale,
      redirectTo: verifiedRedirectTo,
      request,
      tokenHash,
      type: verificationType,
    })
    const subject =
      locale === "en" ? `Your ${siteConfig.siteName} access link` : `Ton accès ${siteConfig.siteName}`
    const textContent = buildMagicLinkTextContent({ confirmationUrl, locale, requiresPasswordSetup })
    const htmlContent = buildMagicLinkHtmlContent({ confirmationUrl, locale, requiresPasswordSetup })

    const brevoResponse = await sendBrevoTransactionalEmail({
      htmlContent,
      subject,
      textContent,
      to: [{ email }],
    })

    console.info("[label2a4-auth-magic-link-sent]", {
      emailHash: hashEmail(email),
      messageId: brevoResponse.messageId ?? null,
      mode,
      requiresPasswordSetup,
      userExistedBeforeLink,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[label2a4-auth-magic-link]", error)
    return NextResponse.json(
      {
        error:
          locale === "en"
            ? "Unable to send the sign-in link."
            : "Impossible d'envoyer le lien de connexion.",
      },
      { status: 500 },
    )
  }
}
