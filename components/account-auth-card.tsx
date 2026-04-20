"use client"

import { useState, type FormEvent } from "react"
import { reportClientError } from "@/lib/client-monitoring"
import { siteConfig } from "@/lib/site-config"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"
import { cn } from "@/lib/utils"

interface AccountAuthCardProps {
  email?: string | null
  isAuthenticated: boolean
  onSessionChanged?: () => Promise<void> | void
}

const inputClass =
  "w-full rounded-[18px] border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"

function getCurrentAuthRedirectUrl() {
  const redirectUrl = new URL("/auth/callback", window.location.origin)
  const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
  redirectUrl.searchParams.set("next", nextPath.startsWith("/") ? nextPath : "/compte")

  return redirectUrl.toString()
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}

export function AccountAuthCard({ email, isAuthenticated, onSessionChanged }: AccountAuthCardProps) {
  const [emailInput, setEmailInput] = useState(email ?? "")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!emailInput.trim()) {
      setError("Saisissez votre email pour créer ou ouvrir votre compte.")
      return
    }

    setIsSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const supabase = getSupabaseBrowserClient()

      const { error: authError } = await supabase.auth.signInWithOtp({
        email: emailInput.trim(),
        options: {
          emailRedirectTo: getCurrentAuthRedirectUrl(),
        },
      })

      if (authError) {
        throw authError
      }

      setSuccess(
        "Email envoyé. Cliquez sur le lien reçu pour terminer la connexion. Si c'est votre première fois, le compte sera créé automatiquement.",
      )
    } catch (caughtError) {
      reportClientError("account-auth-sign-in", caughtError)
      setError(caughtError instanceof Error ? caughtError.message : "Connexion impossible pour le moment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsSigningInWithGoogle(true)
    setError("")
    setSuccess("")

    try {
      const supabase = getSupabaseBrowserClient()
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getCurrentAuthRedirectUrl(),
        },
      })

      if (authError) {
        throw authError
      }
    } catch (caughtError) {
      reportClientError("account-auth-google-sign-in", caughtError)
      setError(caughtError instanceof Error ? caughtError.message : "Connexion Google impossible pour le moment.")
      setIsSigningInWithGoogle(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setError("")
    setSuccess("")

    try {
      const supabase = getSupabaseBrowserClient()
      const { error: authError } = await supabase.auth.signOut()

      if (authError) {
        throw authError
      }

      await onSessionChanged?.()
      setSuccess("Vous avez été déconnecté.")
    } catch (caughtError) {
      reportClientError("account-auth-sign-out", caughtError)
      setError(caughtError instanceof Error ? caughtError.message : "Déconnexion impossible pour le moment.")
    } finally {
      setIsSigningOut(false)
    }
  }

  if (isAuthenticated) {
    return (
      <div className="space-y-3">
        <div className="rounded-[20px] border border-emerald-200/80 bg-emerald-50/80 p-4 text-sm leading-6 text-emerald-950">
          <div className="font-semibold">Compte connecté</div>
          <div className="mt-1">{email ?? "Email indisponible"}</div>
        </div>
        <button
          type="button"
          className={cn(
            "inline-flex items-center rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50",
          )}
          disabled={isSigningOut}
          onClick={handleSignOut}
        >
          {isSigningOut ? "Déconnexion..." : "Se déconnecter"}
        </button>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-emerald-700">{success}</div>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {siteConfig.auth.googleOAuthEnabled && (
        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          disabled={isSubmitting || isSigningInWithGoogle}
          onClick={handleGoogleSignIn}
        >
          <GoogleIcon />
          {isSigningInWithGoogle ? "Connexion..." : "Créer ou continuer avec Google"}
        </button>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="rounded-[20px] border border-sky-100 bg-sky-50/75 p-4 text-sm leading-6 text-sky-950">
          <div className="font-semibold">Pas de mot de passe à créer</div>
          <p className="mt-1">
            Entrez votre email. Si aucun compte n’existe encore, il sera créé automatiquement avec le lien sécurisé.
          </p>
        </div>
        <div>
          <label htmlFor="account-email" className="mb-2 block text-sm font-medium text-slate-800">
            Votre email
          </label>
          <input
            id="account-email"
            type="email"
            autoComplete="email"
            className={inputClass}
            placeholder="vous@exemple.fr"
            value={emailInput}
            onChange={(event) => setEmailInput(event.currentTarget.value)}
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          disabled={isSubmitting || isSigningInWithGoogle}
        >
          {isSubmitting ? "Envoi du lien..." : "Créer / ouvrir mon compte"}
        </button>
      </form>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-emerald-700">{success}</div>}
    </div>
  )
}
