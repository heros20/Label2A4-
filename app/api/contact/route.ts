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
    const textContent = [
      `Nom: ${name}`,
      `Email: ${email}`,
      `Sujet: ${subject}`,
      "",
      message,
    ].join("\n")
    const htmlContent = `
      <h2>Nouvelle demande support ${escapeHtml(siteConfig.siteName)}</h2>
      <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
      <p><strong>Email :</strong> ${escapeHtml(email)}</p>
      <p><strong>Sujet :</strong> ${escapeHtml(subject)}</p>
      <hr />
      <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
    `

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
