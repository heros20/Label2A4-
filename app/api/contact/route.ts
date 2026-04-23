import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { sendBrevoTransactionalEmail } from "@/lib/brevo"
import { consumeRateLimit } from "@/lib/rate-limit"
import { siteConfig } from "@/lib/site-config"

export const runtime = "nodejs"

const MAX_ATTACHMENT_FILES = 3
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024
const MAX_TOTAL_ATTACHMENT_BYTES = 4 * 1024 * 1024
const MAX_CONTACT_REQUEST_BYTES = MAX_TOTAL_ATTACHMENT_BYTES + 512 * 1024
const ACCEPTED_ATTACHMENT_LABEL = "PNG, JPG, WebP, PDF, TXT ou CSV"

interface ContactPayload {
  email?: unknown
  message?: unknown
  name?: unknown
  subject?: unknown
  website?: unknown
}

interface DetectedAttachmentType {
  extension: string
  mediaType: string
}

interface ValidatedAttachment {
  content: string
  mediaType: string
  name: string
  size: number
}

class ContactValidationError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
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

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} o`
  }

  if (bytes < 1024 * 1024) {
    const value = bytes / 1024
    return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} Ko`
  }

  const value = bytes / (1024 * 1024)
  return `${value.toFixed(value >= 10 ? 1 : 2)} Mo`
}

function hashEmail(email: string) {
  return createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 16)
}

function getRequestContentLength(request: NextRequest) {
  const headerValue = request.headers.get("content-length")
  const contentLength = headerValue ? Number(headerValue) : 0
  return Number.isFinite(contentLength) && contentLength > 0 ? contentLength : 0
}

function isFileEntry(value: FormDataEntryValue): value is File {
  return typeof value !== "string" && typeof value.name === "string" && typeof value.arrayBuffer === "function"
}

function getExtension(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase() ?? ""
  return extension === filename.toLowerCase() ? "" : extension
}

function hasBytes(buffer: Buffer, bytes: number[]) {
  return bytes.every((byte, index) => buffer[index] === byte)
}

function looksLikeText(buffer: Buffer) {
  if (!buffer.length) {
    return false
  }

  for (const byte of buffer) {
    if (byte === 0 || byte < 9 || (byte > 13 && byte < 32)) {
      return false
    }
  }

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(buffer)
    return true
  } catch {
    return false
  }
}

function detectAttachmentType(buffer: Buffer, filename: string, declaredType: string): DetectedAttachmentType | null {
  if (hasBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { extension: "png", mediaType: "image/png" }
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: "jpg", mediaType: "image/jpeg" }
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { extension: "webp", mediaType: "image/webp" }
  }

  if (buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return { extension: "pdf", mediaType: "application/pdf" }
  }

  const extension = getExtension(filename)
  const isTextExtension = extension === "txt" || extension === "log" || extension === "csv"
  const isTextMime = declaredType === "text/plain" || declaredType === "text/csv"
  if ((isTextExtension || isTextMime) && looksLikeText(buffer)) {
    return {
      extension: extension === "csv" ? "csv" : extension === "log" ? "log" : "txt",
      mediaType: extension === "csv" || declaredType === "text/csv" ? "text/csv" : "text/plain",
    }
  }

  return null
}

function sanitizeAttachmentName(filename: string, extension: string, index: number) {
  const withoutPath = filename.split(/[\\/]/).pop() ?? ""
  const withoutExtension = withoutPath.replace(/\.[^.]+$/, "")
  const safeBase = withoutExtension
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/[^A-Za-z0-9._ -]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .replace(/[.-]+$/, "")
    .slice(0, 60)

  return `${safeBase || `piece-jointe-${index + 1}`}.${extension}`
}

async function validateAttachments(files: File[]) {
  const selectedFiles = files.filter((file) => file.name || file.size > 0)

  if (selectedFiles.length > MAX_ATTACHMENT_FILES) {
    throw new ContactValidationError(`Ajoutez ${MAX_ATTACHMENT_FILES} fichiers maximum.`)
  }

  let totalSize = 0
  const attachments: ValidatedAttachment[] = []

  for (const [index, file] of selectedFiles.entries()) {
    if (file.size <= 0) {
      throw new ContactValidationError("Un fichier joint est vide.")
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new ContactValidationError(
        `Chaque fichier doit faire ${formatFileSize(MAX_ATTACHMENT_BYTES)} maximum.`,
        413,
      )
    }

    totalSize += file.size
    if (totalSize > MAX_TOTAL_ATTACHMENT_BYTES) {
      throw new ContactValidationError(
        `Les pièces jointes doivent faire ${formatFileSize(MAX_TOTAL_ATTACHMENT_BYTES)} maximum au total.`,
        413,
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const detectedType = detectAttachmentType(buffer, file.name, file.type)
    if (!detectedType) {
      throw new ContactValidationError(`Format de fichier refuse. Formats acceptes : ${ACCEPTED_ATTACHMENT_LABEL}.`)
    }

    attachments.push({
      content: buffer.toString("base64"),
      mediaType: detectedType.mediaType,
      name: sanitizeAttachmentName(file.name, detectedType.extension, index),
      size: buffer.length,
    })
  }

  return attachments
}

async function readContactRequest(request: NextRequest) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? ""

  if (contentType.includes("multipart/form-data")) {
    const contentLength = getRequestContentLength(request)
    if (contentLength > MAX_CONTACT_REQUEST_BYTES) {
      throw new ContactValidationError(
        `La demande est trop lourde. Pieces jointes: ${formatFileSize(MAX_TOTAL_ATTACHMENT_BYTES)} maximum au total.`,
        413,
      )
    }

    const formData = await request.formData()
    return {
      attachments: await validateAttachments(formData.getAll("attachments").filter(isFileEntry)),
      payload: {
        email: formData.get("email"),
        message: formData.get("message"),
        name: formData.get("name"),
        subject: formData.get("subject"),
        website: formData.get("website"),
      } satisfies ContactPayload,
    }
  }

  if (!contentType || contentType.includes("application/json")) {
    return {
      attachments: [],
      payload: (await request.json()) as ContactPayload,
    }
  }

  throw new ContactValidationError("Format de demande non pris en charge.", 415)
}

function buildAttachmentTextContent(attachments: ValidatedAttachment[]) {
  if (!attachments.length) {
    return ["", "Pieces jointes: aucune"]
  }

  return [
    "",
    "Pieces jointes:",
    ...attachments.map((attachment) => `- ${attachment.name} (${attachment.mediaType}, ${formatFileSize(attachment.size)})`),
  ]
}

function buildContactTextContent(input: {
  attachments: ValidatedAttachment[]
  email: string
  message: string
  name: string
  subject: string
}) {
  return [
    "Nouvelle demande support Label2A4",
    "",
    `Nom: ${input.name}`,
    `Email: ${input.email}`,
    `Sujet: ${input.subject}`,
    ...buildAttachmentTextContent(input.attachments),
    "",
    "Message:",
    input.message,
  ].join("\n")
}

function buildAttachmentHtmlContent(attachments: ValidatedAttachment[]) {
  if (!attachments.length) {
    return `<p style="margin:0;font-size:14px;line-height:1.65;color:#526072;">Aucune pièce jointe.</p>`
  }

  const items = attachments
    .map(
      (attachment) => `
        <li style="margin:0 0 8px 0;font-size:14px;line-height:1.6;color:#526072;">
          <strong style="color:#0f172a;">${escapeHtml(attachment.name)}</strong>
          <span style="color:#64748b;">- ${escapeHtml(attachment.mediaType)}, ${formatFileSize(attachment.size)}</span>
        </li>`,
    )
    .join("")

  return `<ul style="margin:0;padding-left:20px;">${items}</ul>`
}

function buildContactHtmlContent(input: {
  attachments: ValidatedAttachment[]
  email: string
  message: string
  name: string
  subject: string
}) {
  const name = escapeHtml(input.name)
  const email = escapeHtml(input.email)
  const subject = escapeHtml(input.subject)
  const message = escapeHtml(input.message).replace(/\n/g, "<br />")
  const attachments = buildAttachmentHtmlContent(input.attachments)

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
                Pieces jointes
              </p>

              <div style="padding:18px 20px;background:#ffffff;border:1px solid #d6e2ee;border-radius:16px;margin:0 0 24px 0;">
                ${attachments}
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
                      Repondre par email
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
                Ce message a ete envoye depuis le formulaire de contact public de Label2A4.
              </p>

              <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
                Label2A4 - Support utilisateur.
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
        { error: "Trop de demandes de contact. Réessayez dans quelques minutes." },
        { status: 429 },
      )
    }

    const { attachments, payload } = await readContactRequest(request)

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
    const textContent = buildContactTextContent({ attachments, email, message, name, subject })
    const htmlContent = buildContactHtmlContent({ attachments, email, message, name, subject })

    const brevoResponse = await sendBrevoTransactionalEmail({
      attachments: attachments.map((attachment) => ({
        content: attachment.content,
        name: attachment.name,
      })),
      htmlContent,
      replyTo: { email, name },
      subject: emailSubject,
      textContent,
    })

    console.info("[label2a4-contact-sent]", {
      attachmentCount: attachments.length,
      attachmentBytes: attachments.reduce((total, attachment) => total + attachment.size, 0),
      emailHash: hashEmail(email),
      messageId: brevoResponse.messageId ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ContactValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error("[label2a4-contact]", error)
    return NextResponse.json(
      { error: "Impossible d'envoyer le message pour le moment. Utilisez l'email de support." },
      { status: 500 },
    )
  }
}
