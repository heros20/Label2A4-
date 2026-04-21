import "server-only"
import { siteConfig } from "@/lib/site-config"

interface BrevoEmailAddress {
  email: string
  name?: string
}

interface SendBrevoEmailInput {
  htmlContent: string
  replyTo?: BrevoEmailAddress
  subject: string
  textContent: string
  to?: BrevoEmailAddress[]
}

interface BrevoSendResponse {
  messageId?: string
}

const BREVO_TRANSACTIONAL_EMAIL_URL = "https://api.brevo.com/v3/smtp/email"
const DEFAULT_BREVO_SENDER_EMAIL = "support@label2a4.com"

function readRequiredEmail(value: string | undefined, fallback: string) {
  return value?.trim() || fallback
}

function getBrevoApiKey() {
  return process.env.BREVO_API_KEY?.trim() ?? ""
}

function getBrevoSender(): BrevoEmailAddress {
  return {
    email: readRequiredEmail(process.env.BREVO_SENDER_EMAIL, DEFAULT_BREVO_SENDER_EMAIL),
    name: process.env.BREVO_SENDER_NAME?.trim() || siteConfig.siteName,
  }
}

function getBrevoSupportRecipient(): BrevoEmailAddress {
  return {
    email: readRequiredEmail(process.env.BREVO_SUPPORT_TO_EMAIL, siteConfig.supportEmail),
    name: process.env.BREVO_SUPPORT_TO_NAME?.trim() || "Support Label2A4",
  }
}

export function isBrevoConfigured() {
  return Boolean(getBrevoApiKey())
}

export async function sendBrevoTransactionalEmail(input: SendBrevoEmailInput) {
  const apiKey = getBrevoApiKey()

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured.")
  }

  const response = await fetch(BREVO_TRANSACTIONAL_EMAIL_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      htmlContent: input.htmlContent,
      replyTo: input.replyTo,
      sender: getBrevoSender(),
      subject: input.subject,
      textContent: input.textContent,
      to: input.to?.length ? input.to : [getBrevoSupportRecipient()],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Brevo email send failed with status ${response.status}: ${errorBody.slice(0, 500)}`)
  }

  return (await response.json()) as BrevoSendResponse
}
