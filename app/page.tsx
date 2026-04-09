"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Download, FileText, MoveDown, MoveUp, Trash2, Upload } from "lucide-react"
import { downloadBlob } from "@/lib/download"
import { LABEL_PROFILES, type LabelProfileId } from "@/lib/label-profiles"
import {
  buildLabelA4Pdf,
  buildLabelPdfName,
  getPdfPageCount,
  type SingleLabelSlot,
} from "@/lib/pdf-tools"
import { cn, formatFileSize } from "@/lib/utils"

type FileWithId = File & { id: string }

const SINGLE_LABEL_PLACEMENTS: Array<{ id: SingleLabelSlot; label: string }> = [
  { id: "top-left", label: "Haut gauche" },
  { id: "top-right", label: "Haut droite" },
  { id: "bottom-left", label: "Bas gauche" },
  { id: "bottom-right", label: "Bas droite" },
]

export default function HomePage() {
  const [files, setFiles] = useState<FileWithId[]>([])
  const [focusedFileId, setFocusedFileId] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<LabelProfileId>(LABEL_PROFILES[0].id)
  const [singleLabelSlot, setSingleLabelSlot] = useState<SingleLabelSlot>("top-right")
  const [pageCounts, setPageCounts] = useState<Record<string, number>>({})
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultError, setResultError] = useState("")
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const workspaceRef = useRef<HTMLElement | null>(null)

  const selectedProfile = LABEL_PROFILES.find((profile) => profile.id === profileId) ?? LABEL_PROFILES[0]
  const focusedFile = files.find((file) => file.id === focusedFileId) ?? files[0] ?? null
  const isSingleSourcePdf = files.length === 1

  useEffect(() => {
    if (!result?.blob) {
      setResultUrl(null)
      return
    }

    const url = URL.createObjectURL(result.blob)
    setResultUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [result])

  useEffect(() => {
    if (files.length === 0) {
      setPageCounts({})
      return
    }

    let active = true

    Promise.all(files.map(async (file) => [file.id, await getPdfPageCount(file)] as const))
      .then((entries) => {
        if (active) {
          setPageCounts(Object.fromEntries(entries))
        }
      })
      .catch(() => {
        if (active) {
          setPageCounts({})
        }
      })

    return () => {
      active = false
    }
  }, [files])

  useEffect(() => {
    if (files.length === 0) {
      return
    }

    workspaceRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }, [files.length])

  useEffect(() => {
    if (files.length === 0) {
      setResult(null)
      setResultError("")
      return
    }

    let active = true
    setIsGenerating(true)
    setResultError("")

    buildLabelA4Pdf(files, profileId, singleLabelSlot)
      .then((blob) => {
        if (active) {
          setResult({ blob, name: buildLabelPdfName(files, profileId) })
        }
      })
      .catch((error) => {
        if (active) {
          setResult(null)
          setResultError(error instanceof Error ? error.message : "Impossible de generer le PDF.")
        }
      })
      .finally(() => {
        if (active) {
          setIsGenerating(false)
        }
      })

    return () => {
      active = false
    }
  }, [files, profileId, singleLabelSlot])

  const updateFiles = (nextFiles: FileWithId[]) => {
    setFiles(nextFiles)
    setFocusedFileId(
      (current) => nextFiles.find((file) => file.id === current)?.id ?? nextFiles[0]?.id ?? null,
    )
  }

  const addFiles = (incomingFiles: File[]) => {
    const pdfFiles = incomingFiles
      .filter((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))
      .map((file) => Object.assign(file, { id: crypto.randomUUID() }) as FileWithId)

    updateFiles([...files, ...pdfFiles])
  }

  const moveFile = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= files.length) {
      return
    }

    const nextFiles = [...files]
    ;[nextFiles[index], nextFiles[nextIndex]] = [nextFiles[nextIndex], nextFiles[index]]
    updateFiles(nextFiles)
  }

  const totalLabels = useMemo(
    () => files.reduce((sum, file) => sum + (pageCounts[file.id] ?? 0), 0),
    [files, pageCounts],
  )
  const totalSheets = Math.ceil(totalLabels / 4)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-sm">
        <div className="max-w-4xl">
          <div className="mb-5 inline-flex rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700">
            Fusion + rognage + planche A4 x4
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Glissez vos PDF, choisissez un profil d etiquette, puis sortez des feuilles A4 de 4 etiquettes
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Le flux reste fixe : fusionner, rogner selon le profil choisi, redimensionner automatiquement
            et placer les etiquettes par 4 sur chaque feuille A4 en commencant en haut a droite.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {LABEL_PROFILES.map((profile) => (
            <button
              key={profile.id}
              type="button"
              className={cn(
                "rounded-[24px] border px-5 py-5 text-left transition",
                profileId === profile.id
                  ? "border-violet-500 bg-violet-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-violet-300",
              )}
              onClick={() => setProfileId(profile.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-xl font-semibold text-slate-950">{profile.title}</div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {profile.badge}
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{profile.description}</p>
            </button>
          ))}
        </div>

        <label
          className={cn(
            "mt-8 flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center transition",
            "hover:border-violet-500 hover:bg-violet-50/70",
          )}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            addFiles(Array.from(event.dataTransfer.files))
          }}
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
          />
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <Upload className="h-10 w-10" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-950">Glissez deposez vos PDF ici</h2>
          <p className="mt-2 text-slate-600">Le lot est fusionne dans l ordre de la liste, puis compose en A4 x4</p>
          <p className="mt-1 text-sm text-slate-500">
            Ordre de placement : haut droite, haut gauche, bas droite, bas gauche
          </p>
        </label>
      </section>

      {files.length > 0 && (
        <section ref={workspaceRef} className="mt-8 grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Lot source</h2>
                  <p className="mt-2 text-slate-600">
                    {files.length} fichier(s), {totalLabels || "?"} etiquette(s), {totalSheets || 0} feuille(s) A4 prevue(s)
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-red-300 hover:text-red-600"
                  onClick={() => updateFiles([])}
                >
                  Vider
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {files.map((file, index) => (
                  <div
                    key={file.id}
                    className={cn(
                      "flex items-center gap-4 rounded-[22px] border border-slate-200 px-4 py-4 transition",
                      focusedFile?.id === file.id && "border-violet-500 bg-violet-50/60",
                    )}
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => setFocusedFileId(file.id)}
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-950">{file.name}</div>
                        <div className="text-sm text-slate-500">
                          {formatFileSize(file.size)} · {pageCounts[file.id] ?? "?"} page(s)
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 p-2 text-slate-600 disabled:opacity-40"
                        disabled={index === 0}
                        onClick={() => moveFile(index, -1)}
                      >
                        <MoveUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 p-2 text-slate-600 disabled:opacity-40"
                        disabled={index === files.length - 1}
                        onClick={() => moveFile(index, 1)}
                      >
                        <MoveDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 p-2 text-red-600"
                        onClick={() => updateFiles(files.filter((current) => current.id !== file.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Pipeline applique</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-[20px] bg-slate-50 p-4 text-sm text-slate-700">1. Fusion dans l ordre</div>
                <div className="rounded-[20px] bg-slate-50 p-4 text-sm text-slate-700">2. Rognage {selectedProfile.shortLabel}</div>
                <div className="rounded-[20px] bg-slate-50 p-4 text-sm text-slate-700">3. Resize auto</div>
                <div className="rounded-[20px] bg-slate-50 p-4 text-sm text-slate-700">4. Placement A4 x4</div>
              </div>
            </div>

            {isSingleSourcePdf && (
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-950">Placement de l etiquette unique</h2>
                <p className="mt-2 text-slate-600">
                  Quand un seul PDF est charge, vous pouvez choisir le quart de feuille A4 a utiliser.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {SINGLE_LABEL_PLACEMENTS.map((placement) => (
                    <button
                      key={placement.id}
                      type="button"
                      className={cn(
                        "rounded-[20px] border px-4 py-4 text-left text-sm font-medium transition",
                        singleLabelSlot === placement.id
                          ? "border-violet-500 bg-violet-50 text-violet-800"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-violet-300",
                      )}
                      onClick={() => setSingleLabelSlot(placement.id)}
                    >
                      {placement.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Resultat final</h2>
              <p className="mt-2 text-slate-600">
                {isSingleSourcePdf
                  ? "Sortie placee sur le quart de feuille A4 choisi."
                  : "Sortie composee par 4 sur feuille A4, en commencant en haut a droite."}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[20px] bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Profil</div>
                  <div className="mt-1 font-medium text-slate-900">{selectedProfile.shortLabel}</div>
                </div>
                <div className="rounded-[20px] bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Etiquettes</div>
                  <div className="mt-1 font-medium text-slate-900">{totalLabels || 0}</div>
                </div>
                <div className="rounded-[20px] bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Feuilles A4</div>
                  <div className="mt-1 font-medium text-slate-900">{totalSheets || 0}</div>
                </div>
              </div>

              {isSingleSourcePdf && (
                <div className="mt-3 rounded-[20px] bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Position</div>
                  <div className="mt-1 font-medium text-slate-900">
                    {SINGLE_LABEL_PLACEMENTS.find((placement) => placement.id === singleLabelSlot)?.label}
                  </div>
                </div>
              )}

              <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                {resultUrl ? (
                  <iframe
                    title="Apercu du PDF genere"
                    src={`${resultUrl}#toolbar=0&navpanes=0&view=FitH`}
                    className="h-[780px] w-full border-0"
                  />
                ) : (
                  <div className="flex h-[780px] items-center justify-center px-6 text-center text-slate-500">
                    {isGenerating ? "Generation du PDF..." : resultError || "Aucun resultat pour le moment."}
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-violet-600 px-5 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                  disabled={!result}
                  onClick={() => result && downloadBlob(result.blob, result.name)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Telecharger le PDF A4
                </button>
                <div className="text-sm text-slate-500">
                  {isGenerating ? "Recalcul en cours..." : result?.name ?? "En attente de generation"}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
