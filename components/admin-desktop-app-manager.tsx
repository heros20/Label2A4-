"use client"

import { Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { formatFileSize } from "@/lib/utils"

interface AdminDesktopAppManagerProps {
  exists: boolean
  fileName: string
  sizeBytes: number
  updatedAt: string | null
}

export function AdminDesktopAppManager({
  exists,
  fileName,
  sizeBytes,
  updatedAt,
}: AdminDesktopAppManagerProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const uploadInstaller = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsUploading(true)
    setMessage("")
    setError("")

    try {
      const form = event.currentTarget
      const formData = new FormData(form)
      const response = await fetch("/api/admin/desktop-app", {
        method: "POST",
        body: formData,
      })
      const payload = (await response.json()) as { error?: string; ok?: boolean }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Upload impossible.")
      }

      form.reset()
      setMessage("Application bureau remplacee.")
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Upload impossible.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={uploadInstaller} className="rounded-[20px] border border-slate-200/80 bg-white/85 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-950">Application bureau</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Remplace le setup telecharge par les utilisateurs depuis le bouton du header.
          </p>
        </div>
        <div
          className={
            exists
              ? "w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
              : "w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
          }
        >
          {exists ? "Fichier disponible" : "Aucun fichier"}
        </div>
      </div>

      <div className="mt-4 rounded-[18px] border border-slate-200/80 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600">
        <p>
          <strong className="text-slate-900">Nom public :</strong> {fileName}
        </p>
        <p>
          <strong className="text-slate-900">Statut :</strong>{" "}
          {exists
            ? `${formatFileSize(sizeBytes)}${updatedAt ? `, remplace le ${updatedAt}` : ""}`
            : "Ajoutez un setup.exe pour activer le telechargement."}
        </p>
      </div>

      <fieldset disabled={isUploading} className="mt-4 grid gap-3">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Nouveau setup.exe
          <input
            type="file"
            name="installer"
            accept=".exe,application/vnd.microsoft.portable-executable,application/x-msdownload"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            required
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isUploading}
            className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Upload..." : "Remplacer le setup"}
          </button>
          {message && <p className="text-sm font-medium text-emerald-700">{message}</p>}
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </div>
      </fieldset>
    </form>
  )
}
