"use client"

import { useState } from "react"

export function AdminLogoutButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      await fetch("/api/admin/session", {
        method: "DELETE",
      })
    } finally {
      window.location.href = "/admin"
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50"
    >
      {isLoading ? "Déconnexion..." : "Fermer la session admin"}
    </button>
  )
}
