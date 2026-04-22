"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { reportClientError } from "@/lib/client-monitoring"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

const MIN_PASSWORD_LENGTH = 8

const inputClass =
  "w-full rounded-[18px] border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"

function getFriendlyResetError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ""

  if (message.includes("session") || message.includes("token") || message.includes("expired")) {
    return "Lien de réinitialisation invalide ou expiré. Demandez un nouvel email."
  }

  if (message.includes("password")) {
    return "Le mot de passe ne respecte pas les règles de sécurité."
  }

  return "Impossible de mettre à jour le mot de passe."
}

export function PasswordResetCard() {
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`)
      return
    }

    if (password !== passwordConfirmation) {
      setError("Les deux mots de passe ne correspondent pas.")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { error: authError } = await supabase.auth.updateUser({
        password,
      })

      if (authError) {
        throw authError
      }

      setSuccess("Mot de passe mis à jour.")
      window.setTimeout(() => {
        window.location.assign("/compte")
      }, 900)
    } catch (caughtError) {
      reportClientError("account-auth-password-reset", caughtError)
      setError(getFriendlyResetError(caughtError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-slate-800">
            Nouveau mot de passe
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">{MIN_PASSWORD_LENGTH} caractères minimum.</p>
        </div>

        <div>
          <label htmlFor="new-password-confirmation" className="mb-2 block text-sm font-medium text-slate-800">
            Confirmer le nouveau mot de passe
          </label>
          <input
            id="new-password-confirmation"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.currentTarget.value)}
          />
        </div>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Mise à jour..." : "Mettre à jour le mot de passe"}
        </button>
      </form>

      <Link href="/mot-de-passe-oublie" className="inline-flex text-sm font-medium text-sky-800 hover:underline">
        Demander un nouvel email
      </Link>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-emerald-700">{success}</div>}
    </div>
  )
}
