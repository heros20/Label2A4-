import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { sendBrevoTransactionalEmail } from "@/lib/brevo"
import { consumeRateLimit } from "@/lib/rate-limit"
import { siteConfig } from "@/lib/site-config"

export const runtime = "nodejs"

interface ContactPayload {
  email?: unknown
  message?: unknown
  name?: unknown
  subject?: unknown
  website?: unknown
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim().replace(/\s+/g, " ").slice(0, maxLength)
}

function cleanMessage(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim().slice(0, maxLength)
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
  return createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 16)
}

function buildContactTextContent(input: { email: string; message: string; name: string; subject: string }) {
  return [
    "Nouvelle demande support Label2A4",
    "",
    `Nom: ${input.name}`,
    `Email: ${input.email}`,
    `Sujet: ${input.subject}`,
    "",
    "Message:",
    input.message,
  ].join("\n")
}

function buildContactHtmlContent(input: { email: string; message: string; name: string; subject: string }) {
  const name = escapeHtml(input.name)
  const email = escapeHtml(input.email)
  const subject = escapeHtml(input.subject)
  const message = escapeHtml(input.message).replace(/\n/g, "<br />")

  return `
<div style="margin:0;padding:0;background:#edf3f8;font-family:Segoe UI,Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Nouvelle demande support Label2A4 de ${name}.
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
                Nouvelle demande support
              </h1>

              <p style="margin:12px 0 0 0;font-size:15px;line-height:1.7;color:#526072;">
                Un utilisateur vient d'envoyer un message depuis le formulaire de contact.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:30px 30px 8px 30px;">
              <div style="padding:17px 18px;background:#f8fbfd;border:1px solid #d6e2ee;border-left:4px solid #0369a1;border-radius:16px;margin:0 0 24px 0;">
                <p style="margin:0 0 10px 0;font-size:14px;line-height:1.65;color:#526072;">
                  <strong style="color:#0f172a;">Nom :</strong> ${name}
                </p>
                <p style="margin:0 0 10px 0;font-size:14px;line-height:1.65;color:#526072;">
                  <strong style="color:#0f172a;">Email :</strong> <a href="mailto:${email}" style="color:#0369a1;text-decoration:underline;">${email}</a>
                </p>
                <p style="margin:0;font-size:14px;line-height:1.65;color:#526072;">
                  <strong style="color:#0f172a;">Sujet :</strong> ${subject}
                </p>
              </div>

              <p style="margin:0 0 12px 0;font-size:13px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#0369a1;">
                Message
              </p>

              <div style="padding:18px 20px;background:#ffffff;border:1px solid #d6e2ee;border-radius:16px;margin:0 0 24px 0;">
                <p style="margin:0;font-size:15px;line-height:1.75;color:#0f172a;">
                  ${message}
                </p>
              </div>

              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0 28px 0;">
                <tr>
                  <td align="center" style="border-radius:14px;background:#0369a1;box-shadow:0 10px 24px rgba(3,105,161,0.28);">
                    <a href="mailto:${email}" style="display:inline-block;padding:15px 24px;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:14px;">
                      Répondre par email
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 30px 30px 30px;">
              <hr style="border:none;border-top:1px solid #d6e2ee;margin:0 0 18px 0;" />

              <p style="margin:0 0 8px 0;font-size:13px;line-height:1.6;color:#526072;">
                Ce message a été envoyé depuis le formulaire de contact public de Label2A4.
              </p>

              <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
                © Label2A4 — Support utilisateur.
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
      bucket: "contact",
      limit: 5,
      windowSeconds: 10 * 60,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de demandes de contact. Reessayez dans quelques minutes." },
        { status: 429 },
      )
    }

    const payload = (await request.json()) as ContactPayload

    if (typeof payload.website === "string" && payload.website.trim()) {
      return NextResponse.json({ ok: true })
    }

    const name = cleanText(payload.name, 120)
    const email = cleanText(payload.email, 180).toLowerCase()
    const subject = cleanText(payload.subject, 160) || "Demande support Label2A4"
    const message = cleanMessage(payload.message, 4000)

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Nom, email et message sont requis." }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 })
    }

    const emailSubject = `[${siteConfig.siteName}] ${subject}`
    const textContent = buildContactTextContent({ email, message, name, subject })
    const htmlContent = buildContactHtmlContent({ email, message, name, subject })

    const brevoResponse = await sendBrevoTransactionalEmail({
      htmlContent,
      replyTo: { email, name },
      subject: emailSubject,
      textContent,
    })

    console.info("[label2a4-contact-sent]", {
      emailHash: hashEmail(email),
      messageId: brevoResponse.messageId ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[label2a4-contact]", error)
    return NextResponse.json(
      { error: "Impossible d'envoyer le message pour le moment. Utilisez l'email de support." },
      { status: 500 },
    )
  }
}
