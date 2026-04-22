"use client"

import { Paperclip, X } from "lucide-react"
import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { formatFileSize } from "@/lib/utils"

interface ContactFormProps {
  supportEmail: string
}

const MAX_ATTACHMENT_FILES = 3
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024
const MAX_TOTAL_ATTACHMENT_BYTES = 4 * 1024 * 1024
const ACCEPTED_ATTACHMENT_LABEL = "PNG, JPG, WebP, PDF, TXT ou CSV"
const ACCEPTED_ATTACHMENT_INPUT =
  ".png,.jpg,.jpeg,.webp,.pdf,.txt,.log,.csv,image/png,image/jpeg,image/webp,application/pdf,text/plain,text/csv"

const allowedAttachmentTypes = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf", "text/plain", "text/csv"])
const allowedAttachmentExtensions = new Set(["png", "jpg", "jpeg", "webp", "pdf", "txt", "log", "csv"])

function getExtension(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase() ?? ""
  return extension === filename.toLowerCase() ? "" : extension
}

function getAttachmentValidationError(files: File[]) {
  if (files.length > MAX_ATTACHMENT_FILES) {
    return `${MAX_ATTACHMENT_FILES} fichiers maximum.`
  }

  const totalSize = files.reduce((total, file) => total + file.size, 0)
  if (totalSize > MAX_TOTAL_ATTACHMENT_BYTES) {
    return `Les fichiers doivent faire ${formatFileSize(MAX_TOTAL_ATTACHMENT_BYTES)} maximum au total.`
  }

  const oversizedFile = files.find((file) => file.size > MAX_ATTACHMENT_BYTES)
  if (oversizedFile) {
    return `Chaque fichier doit faire ${formatFileSize(MAX_ATTACHMENT_BYTES)} maximum.`
  }

  const unsupportedFile = files.find((file) => {
    const extension = getExtension(file.name)
    return !allowedAttachmentTypes.has(file.type) && !allowedAttachmentExtensions.has(extension)
  })

  if (unsupportedFile) {
    return `Format refuse. Formats acceptes : ${ACCEPTED_ATTACHMENT_LABEL}.`
  }

  return ""
}

export function ContactForm({ supportEmail }: ContactFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [website, setWebsite] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [feedback, setFeedback] = useState("")

  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextAttachments = Array.from(event.currentTarget.files ?? [])
    const validationError = getAttachmentValidationError(nextAttachments)

    if (validationError) {
      event.currentTarget.value = ""
      setAttachments([])
      setStatus("error")
      setFeedback(validationError)
      return
    }

    setAttachments(nextAttachments)
    if (status === "error") {
      setStatus("idle")
      setFeedback("")
    }
  }

  const removeAttachment = (indexToRemove: number) => {
    setAttachments((currentAttachments) => currentAttachments.filter((_, index) => index !== indexToRemove))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus("loading")
    setFeedback("")

    try {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("message", message)
      formData.append("name", name)
      formData.append("subject", subject)
      formData.append("website", website)
      attachments.forEach((file) => formData.append("attachments", file, file.name))

      const response = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      })
      const payload = (await response.json()) as { error?: string; ok?: boolean }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Impossible d'envoyer le message.")
      }

      setName("")
      setEmail("")
      setSubject("")
      setMessage("")
      setWebsite("")
      setAttachments([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setStatus("success")
      setFeedback("Message envoye. Le support revient vers vous rapidement.")
    } catch (error) {
      setStatus("error")
      setFeedback(error instanceof Error ? error.message : "Impossible d'envoyer le message.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[24px] border border-slate-200/80 bg-white/78 p-5 shadow-[0_22px_50px_-42px_rgba(15,23,42,0.24)]">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Nom
          <input
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            autoComplete="name"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            type="email"
            autoComplete="email"
            required
          />
        </label>
      </div>

      <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
        Sujet
        <input
          value={subject}
          onChange={(event) => setSubject(event.currentTarget.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          placeholder="Question abonnement, bug PDF, remboursement..."
        />
      </label>

      <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
        Message
        <textarea
          value={message}
          onChange={(event) => setMessage(event.currentTarget.value)}
          className="min-h-36 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          required
        />
      </label>

      <div className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
        <span>Pieces jointes</span>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <input
            ref={fileInputRef}
            id="contact-attachments"
            type="file"
            multiple
            accept={ACCEPTED_ATTACHMENT_INPUT}
            className="sr-only"
            disabled={status === "loading"}
            onChange={handleAttachmentChange}
          />
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="contact-attachments"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Paperclip aria-hidden="true" className="h-4 w-4" />
              Ajouter
            </label>
            <p className="text-xs leading-5 text-slate-500">
              {ACCEPTED_ATTACHMENT_LABEL}. {MAX_ATTACHMENT_FILES} fichiers max, {formatFileSize(MAX_ATTACHMENT_BYTES)} chacun,{" "}
              {formatFileSize(MAX_TOTAL_ATTACHMENT_BYTES)} au total.
            </p>
          </div>

          {attachments.length > 0 && (
            <ul className="mt-3 grid gap-2">
              {attachments.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex min-h-10 items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <Paperclip aria-hidden="true" className="h-4 w-4 flex-none text-slate-500" />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="flex-none text-xs text-slate-500">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-900"
                    aria-label={`Retirer ${file.name}`}
                    onClick={() => removeAttachment(index)}
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <label className="hidden">
        Site web
        <input value={website} onChange={(event) => setWebsite(event.currentTarget.value)} tabIndex={-1} />
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {status === "loading" ? "Envoi..." : "Envoyer"}
        </button>
        <a href={`mailto:${supportEmail}`} className="text-sm font-medium text-sky-800 hover:underline">
          Email direct
        </a>
      </div>

      {feedback && (
        <p className={status === "success" ? "mt-4 text-sm font-medium text-emerald-700" : "mt-4 text-sm font-medium text-red-600"}>
          {feedback}
        </p>
      )}
    </form>
  )
}
