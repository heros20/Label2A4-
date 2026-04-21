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

function buildMagicLinkTextContent(actionLink: string) {
  return [
    "Bonjour,",
    "",
    "Ton lien d'accès Label2A4 est prêt.",
    "",
    "Clique sur ce lien pour vérifier ton adresse email et ouvrir ton espace :",
    actionLink,
    "",
    "Avec Label2A4, tu regroupes tes étiquettes sur une feuille A4 pour imprimer plus proprement, plus vite, et avec moins de gaspillage.",
    "",
    "Tu n'as pas demandé ce lien ? Ignore cet email, aucune action ne sera effectuée.",
    "",
    "Label2A4 — Des étiquettes propres, des feuilles optimisées.",
  ].join("\n")
}

function buildMagicLinkHtmlContent(actionLink: string) {
  const escapedActionLink = escapeHtml(actionLink)

  return `
<div style="margin:0;padding:0;background:#edf3f8;font-family:Segoe UI,Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Ton lien d'accès Label2A4 est prêt pour ouvrir ton espace.
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
                Accède à ton espace Label2A4
              </h1>

              <p style="margin:12px 0 0 0;font-size:15px;line-height:1.7;color:#526072;">
                Clique sur le bouton ci-dessous pour continuer vers ton espace et utiliser ton outil d'optimisation d'étiquettes.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:30px 30px 8px 30px;">
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#0f172a;">
                Ton lien d'accès est prêt.
              </p>

              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.7;color:#526072;">
                Ce lien permet de vérifier ton adresse email et de te connecter à <strong>Label2A4</strong>.
                Il est personnel et valable uniquement pendant une durée limitée.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0 28px 0;">
                <tr>
                  <td align="center" style="border-radius:14px;background:#0369a1;box-shadow:0 10px 24px rgba(3,105,161,0.28);">
                    <a href="${escapedActionLink}" style="display:inline-block;padding:15px 24px;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:14px;">
                      Ouvrir mon espace
                    </a>
                  </td>
                </tr>
              </table>

              <div style="padding:17px 18px;background:#f8fbfd;border:1px solid #d6e2ee;border-left:4px solid #f59e0b;border-radius:16px;margin:0 0 24px 0;">
                <p style="margin:0;font-size:14px;line-height:1.65;color:#526072;">
                  Avec Label2A4, tu regroupes tes étiquettes sur une feuille A4 pour imprimer plus proprement, plus vite, et avec moins de gaspillage.
                </p>
              </div>

              <p style="margin:0 0 10px 0;font-size:13px;line-height:1.6;color:#526072;">
                Si le bouton ne fonctionne pas, copie-colle ce lien dans ton navigateur :
              </p>

              <p style="margin:0 0 22px 0;font-size:12px;line-height:1.6;word-break:break-all;color:#64748b;">
                <a href="${escapedActionLink}" style="color:#0369a1;text-decoration:underline;">${escapedActionLink}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 30px 30px 30px;">
              <hr style="border:none;border-top:1px solid #d6e2ee;margin:0 0 18px 0;" />

              <p style="margin:0 0 8px 0;font-size:13px;line-height:1.6;color:#526072;">
                Tu n'as pas demandé ce lien ? Tu peux ignorer cet email, aucune action ne sera effectuée.
              </p>

              <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
                © Label2A4 — Des étiquettes propres, des feuilles optimisées.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`
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

    const subject = `Ton accès ${siteConfig.siteName}`
    const textContent = buildMagicLinkTextContent(actionLink)
    const htmlContent = buildMagicLinkHtmlContent(actionLink)

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
