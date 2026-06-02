"use client"

import { ExternalLink, Link as LinkIcon, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { formatFileSize } from "@/lib/utils"

interface AdminDesktopAppManagerProps {
  downloadUrl: string | null
  exists: boolean
  fileName: string
  sizeBytes: number
  source: "github-release" | "storage-file" | "missing"
  updatedAt: string | null
}

interface AdminDesktopAppResponse {
  error?: string
  ok?: boolean
}

async function readJsonResponse(response: Response): Promise<AdminDesktopAppResponse> {
  const text = await response.text()

  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text) as AdminDesktopAppResponse
  } catch {
    return { error: text.slice(0, 180) }
  }
}

export function AdminDesktopAppManager({
  downloadUrl,
  exists,
  fileName,
  sizeBytes,
  source,
  updatedAt,
}: AdminDesktopAppManagerProps) {
  const router = useRouter()
  const [releaseUrl, setReleaseUrl] = useState(downloadUrl ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const saveReleaseUrl = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage("")
    setError("")

    try {
      const response = await fetch("/api/admin/desktop-app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update-release-url",
          downloadUrl: releaseUrl,
        }),
      })
      const payload = await readJsonResponse(response)

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Impossible d'enregistrer l'URL.")
      }

      setMessage("URL GitHub Release enregistree.")
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Impossible d'enregistrer l'URL.")
    } finally {
      setIsSaving(false)
    }
  }

  const statusLabel =
    source === "github-release"
      ? "GitHub Release configuree"
      : source === "storage-file"
        ? "Ancien fichier disponible"
        : "Aucune URL"

  return (
    <form onSubmit={saveReleaseUrl} className="rounded-[20px] border border-slate-200/80 bg-white/85 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-950">Application bureau</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Collez l'URL directe de l'asset setup.exe publie dans une GitHub Release.
          </p>
        </div>
        <div
          className={
            exists
              ? "w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
              : "w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
          }
        >
          {statusLabel}
        </div>
      </div>

      <div className="mt-4 rounded-[18px] border border-slate-200/80 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600">
        <p>
          <strong className="text-slate-900">Nom public :</strong> {fileName}
        </p>
        <p>
          <strong className="text-slate-900">Statut :</strong>{" "}
          {source === "github-release"
            ? updatedAt
              ? `URL remplacee le ${updatedAt}`
              : "URL GitHub Release active"
            : source === "storage-file"
              ? `${formatFileSize(sizeBytes)}${updatedAt ? `, remplace le ${updatedAt}` : ""}`
              : "Ajoutez une URL GitHub Release pour activer le telechargement."}
        </p>
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-2 font-medium text-sky-800 underline"
          >
            <ExternalLink className="h-4 w-4" />
            Ouvrir l'asset configure
          </a>
        )}
      </div>

      <fieldset disabled={isSaving} className="mt-4 grid gap-3">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          URL GitHub Release
          <div className="relative">
            <LinkIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="url"
              value={releaseUrl}
              onChange={(event) => setReleaseUrl(event.currentTarget.value)}
              placeholder="https://github.com/..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              required
            />
          </div>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Enregistrement..." : "Enregistrer l'URL"}
          </button>
          {message && <p className="text-sm font-medium text-emerald-700">{message}</p>}
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </div>
      </fieldset>
    </form>
  )
}
