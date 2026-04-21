"use client"

import { useState } from "react"

interface ContactFormProps {
  supportEmail: string
}

export function ContactForm({ supportEmail }: ContactFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [website, setWebsite] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [feedback, setFeedback] = useState("")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus("loading")
    setFeedback("")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          message,
          name,
          subject,
          website,
        }),
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
