"use client"

import Link from "next/link"
import { useEffect, useState, type FormEvent } from "react"
import { reportClientError } from "@/lib/client-monitoring"
import { siteConfig } from "@/lib/site-config"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"
import { cn } from "@/lib/utils"

export type AccountAuthMode = "sign-in" | "sign-up" | "forgot-password"

interface AccountAuthCardProps {
  email?: string | null
  initialMode?: AccountAuthMode
  isAuthenticated: boolean
  onSessionChanged?: () => Promise<void> | void
  redirectAfterSignOut?: string | null
}

const MIN_PASSWORD_LENGTH = 8

const inputClass =
  "w-full rounded-[18px] border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"

function getSafePath(value: string | null | undefined, fallback = "/compte") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback
  }

  return value
}

function getNextPathFromLocation() {
  const nextPath = new URLSearchParams(window.location.search).get("next")
  return getSafePath(nextPath, "/compte")
}

function getCurrentAuthRedirectUrl(nextPath = getNextPathFromLocation()) {
  const redirectUrl = new URL("/auth/callback", window.location.origin)
  redirectUrl.searchParams.set("next", getSafePath(nextPath, "/compte"))

  return redirectUrl.toString()
}

function withPathStatus(path: string, status: string) {
  const url = new URL(getSafePath(path, "/compte"), window.location.origin)
  url.searchParams.set("status", status)
  return `${url.pathname}${url.search}`
}

function getResetPasswordRedirectUrl() {
  return getCurrentAuthRedirectUrl("/auth/reset-password")
}

function getFriendlyAuthError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message.toLowerCase() : ""

  if (message.includes("invalid login") || message.includes("invalid credentials")) {
    return "Email ou mot de passe incorrect."
  }

  if (message.includes("email not confirmed")) {
    return "Vérifiez votre email avant de vous connecter."
  }

  if (message.includes("already registered") || message.includes("already exists")) {
    return "Un compte existe déjà pour cet email. Connectez-vous ou utilisez « Mot de passe oublié ? »."
  }

  if (message.includes("password")) {
    return "Le mot de passe ne respecte pas les règles de sécurité."
  }

  return fallback
}

function isValidPassword(password: string) {
  return password.length >= MIN_PASSWORD_LENGTH
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

export function AccountAuthCard({
  email,
  initialMode = "sign-in",
  isAuthenticated,
  onSessionChanged,
  redirectAfterSignOut = "/connexion?status=signed-out",
}: AccountAuthCardProps) {
  const [mode] = useState<AccountAuthMode>(initialMode)
  const [emailInput, setEmailInput] = useState(email ?? "")
  const [passwordInput, setPasswordInput] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [magicLinkEmailInput, setMagicLinkEmailInput] = useState(email ?? "")
  const [nextPath, setNextPath] = useState("/compte")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false)
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const cleanEmail = emailInput.trim().toLowerCase()
  const cleanMagicLinkEmail = magicLinkEmailInput.trim().toLowerCase()
  const isSignInMode = mode === "sign-in"
  const isSignUpMode = mode === "sign-up"
  const isForgotPasswordMode = mode === "forgot-password"

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("status")
    setNextPath(getNextPathFromLocation())

    if (status === "signed-out") {
      setSuccess("Vous êtes déconnecté.")
    }
  }, [])

  const getAuthHref = (path: "/connexion" | "/inscription" | "/mot-de-passe-oublie") => {
    if (nextPath === "/compte") {
      return path
    }

    return `${path}?next=${encodeURIComponent(nextPath)}`
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!cleanEmail) {
      setError("Saisissez votre email.")
      return
    }

    if (!isForgotPasswordMode && !passwordInput) {
      setError("Saisissez votre mot de passe.")
      return
    }

    if (isSignUpMode && !isValidPassword(passwordInput)) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`)
      return
    }

    if (isSignUpMode && passwordInput !== passwordConfirmation) {
      setError("Les deux mots de passe ne correspondent pas.")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = getSupabaseBrowserClient()

      if (isForgotPasswordMode) {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: getResetPasswordRedirectUrl(),
        })

        if (authError) {
          throw authError
        }

        setSuccess("Email de réinitialisation envoyé.")
        return
      }

      if (isSignUpMode) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: passwordInput,
          options: {
            emailRedirectTo: getCurrentAuthRedirectUrl(withPathStatus(getNextPathFromLocation(), "account-confirmed")),
          },
        })

        if (authError) {
          throw authError
        }

        if (data.session) {
          setSuccess("Compte créé. Vous êtes connecté.")
          window.location.assign(getNextPathFromLocation())
          return
        }

        setSuccess(
          "Si cette adresse est valide, vous recevrez un email. Ouvrez-le pour valider votre compte. (Pensez à vérifier vos spams)",
        )
        return
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: passwordInput,
      })

      if (authError) {
        throw authError
      }

      setSuccess("Vous êtes connecté.")
      window.location.assign(getNextPathFromLocation())
    } catch (caughtError) {
      reportClientError("account-auth-password", caughtError)
      setError(
        getFriendlyAuthError(
          caughtError,
          isForgotPasswordMode
            ? "Impossible d'envoyer l'email de réinitialisation."
            : isSignUpMode
              ? "Impossible de créer ce compte."
              : "Email ou mot de passe incorrect.",
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMagicLinkSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!cleanMagicLinkEmail) {
      setError("Saisissez votre email pour recevoir un lien de connexion.")
      return
    }

    setIsSendingMagicLink(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanMagicLinkEmail,
          mode,
          redirectTo: getCurrentAuthRedirectUrl(isSignUpMode ? "/auth/reset-password" : getNextPathFromLocation()),
        }),
      })
      const payload = (await response.json()) as { error?: string; ok?: boolean }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Impossible d'envoyer le lien de connexion.")
      }

      setSuccess(
        isSignUpMode
          ? "Email envoyé. Cliquez sur le lien reçu pour définir votre mot de passe."
          : "Email envoyé. Cliquez sur le lien reçu pour terminer la connexion.",
      )
    } catch (caughtError) {
      reportClientError("account-auth-magic-link", caughtError)
      setError("Impossible d'envoyer le lien de connexion.")
    } finally {
      setIsSendingMagicLink(false)
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
      setError("Connexion Google impossible pour le moment.")
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
      setSuccess("Vous êtes déconnecté.")

      if (redirectAfterSignOut) {
        window.location.assign(redirectAfterSignOut)
      }
    } catch (caughtError) {
      reportClientError("account-auth-sign-out", caughtError)
      setError("Déconnexion impossible pour le moment.")
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
      {siteConfig.auth.googleOAuthEnabled && !isForgotPasswordMode && (
        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          disabled={isSubmitting || isSigningInWithGoogle}
          onClick={handleGoogleSignIn}
        >
          <GoogleIcon />
          {isSigningInWithGoogle ? "Connexion..." : "Continuer avec Google"}
        </button>
      )}

      <form className="space-y-3" onSubmit={handlePasswordSubmit}>
        <div>
          <label htmlFor="account-email" className="mb-2 block text-sm font-medium text-slate-800">
            Email
          </label>
          <input
            id="account-email"
            type="email"
            autoComplete="email"
            className={inputClass}
            placeholder="vous@exemple.fr"
            value={emailInput}
            onChange={(event) => {
              setEmailInput(event.currentTarget.value)
              setMagicLinkEmailInput(event.currentTarget.value)
            }}
          />
        </div>

        {!isForgotPasswordMode && (
          <div>
            <label htmlFor="account-password" className="mb-2 block text-sm font-medium text-slate-800">
              Mot de passe
            </label>
            <input
              id="account-password"
              type="password"
              autoComplete={isSignUpMode ? "new-password" : "current-password"}
              className={inputClass}
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.currentTarget.value)}
            />
            {isSignUpMode && (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {MIN_PASSWORD_LENGTH} caractères minimum.
              </p>
            )}
          </div>
        )}

        {isSignUpMode && (
          <div>
            <label htmlFor="account-password-confirmation" className="mb-2 block text-sm font-medium text-slate-800">
              Confirmer le mot de passe
            </label>
            <input
              id="account-password-confirmation"
              type="password"
              autoComplete="new-password"
              className={inputClass}
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.currentTarget.value)}
            />
          </div>
        )}

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          disabled={isSubmitting || isSigningInWithGoogle}
        >
          {isSubmitting
            ? isForgotPasswordMode
              ? "Envoi..."
              : isSignUpMode
                ? "Création..."
                : "Connexion..."
            : isForgotPasswordMode
              ? "Envoyer l'email"
              : isSignUpMode
                ? "Créer un compte"
                : "Se connecter"}
        </button>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-emerald-700">{success}</div>}
      </form>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {!isSignInMode && (
          <Link href={getAuthHref("/connexion")} className="font-medium text-sky-800 hover:underline">
            Se connecter
          </Link>
        )}
        {!isSignUpMode && (
          <Link href={getAuthHref("/inscription")} className="font-medium text-sky-800 hover:underline">
            Créer un compte
          </Link>
        )}
        {!isForgotPasswordMode && (
          <Link href={getAuthHref("/mot-de-passe-oublie")} className="font-medium text-sky-800 hover:underline">
            Mot de passe oublié ?
          </Link>
        )}
      </div>

      {!isForgotPasswordMode && (
        <details className="rounded-[18px] border border-slate-200/80 bg-slate-50/70 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-800">
            Recevoir un lien de connexion par email
          </summary>
          <form className="mt-4 space-y-3" onSubmit={handleMagicLinkSubmit}>
            <div>
              <label htmlFor="magic-link-email" className="mb-2 block text-sm font-medium text-slate-800">
                Email
              </label>
              <input
                id="magic-link-email"
                type="email"
                autoComplete="email"
                className={inputClass}
                placeholder="vous@exemple.fr"
                value={magicLinkEmailInput}
                onChange={(event) => setMagicLinkEmailInput(event.currentTarget.value)}
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              disabled={isSendingMagicLink || isSubmitting}
            >
              {isSendingMagicLink ? "Envoi du lien..." : "Envoyer un lien sécurisé"}
            </button>
          </form>
        </details>
      )}

    </div>
  )
}
