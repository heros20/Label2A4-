"use client"

import { useState } from "react"

export function AdminLoginForm() {
  const [token, setToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      const payload = (await response.json()) as { error?: string; ok?: boolean }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Accès admin refusé.")
      }

      window.location.reload()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Impossible d’ouvrir l’espace admin.")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="admin-token">
          Token admin
        </label>
        <input
          id="admin-token"
          type="password"
          value={token}
          onChange={(event) => setToken(event.currentTarget.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          placeholder="Saisissez le token de dashboard"
          autoComplete="current-password"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !token.trim()}
        className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isLoading ? "Connexion..." : "Ouvrir le dashboard"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
