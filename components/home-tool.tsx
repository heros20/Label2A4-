"use client"

import Link from "next/link"
import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import { Download, FileText, Leaf, MoveDown, MoveUp, Printer, RotateCcw, RotateCw, Trash2, Upload } from "lucide-react"
import { ManualCropEditor } from "@/components/manual-crop-editor"
import { trackClientEvent } from "@/lib/client-analytics"
import { downloadBlob, printBlob } from "@/lib/download"
import {
  DEFAULT_MANUAL_CROP_RECT,
  DEFAULT_MONDIAL_RELAY_VARIANT_ID,
  LABEL_PROFILES,
  MONDIAL_RELAY_VARIANTS,
  getResolvedLabelProfile,
  type LabelProfileId,
  type ManualCropRect,
  type MondialRelayVariantId,
} from "@/lib/label-profiles"
import { renderPdfPageToImage } from "@/lib/pdf-image-tools"
import {
  buildLabelA4Pdf,
  buildLabelPdfName,
  getPdfPageCount,
  normalizeManualCropRect,
  normalizePdfRotation,
  type PdfRotation,
  type SingleLabelSlot,
} from "@/lib/pdf-tools"
import { reportClientError } from "@/lib/client-monitoring"
import { calculateLabelImpact } from "@/lib/impact"
import type { AccessSnapshot, ImpactSnapshot } from "@/lib/monetization-types"
import { formatEuroFromCents, getPlanLabel, siteConfig } from "@/lib/site-config"
import { cn, formatFileSize } from "@/lib/utils"

type FileWithId = File & { id: string }
type PreviewImage = { url: string; width: number; height: number }
type AccessResponsePayload = { access?: AccessSnapshot; error?: string }
type ImpactResponsePayload = { error?: string; impact?: ImpactSnapshot }
type ExportResponsePayload = {
  allowed?: boolean
  error?: string
  impact?: ImpactSnapshot
  reason?: string
  snapshot?: AccessSnapshot
}

const MOBILE_MEDIA_QUERY = "(max-width: 1023px)"
const PDF_ROTATION_PRESETS: Array<{ value: PdfRotation; label: string }> = [
  { value: 0, label: "0\u00B0" },
  { value: 90, label: "90\u00B0" },
  { value: 180, label: "180\u00B0" },
  { value: 270, label: "270\u00B0" },
]

const SINGLE_LABEL_PLACEMENTS: Array<{ id: SingleLabelSlot; label: string }> = [
  { id: "top-left", label: "En haut à gauche" },
  { id: "top-right", label: "En haut à droite" },
  { id: "bottom-left", label: "En bas à gauche" },
  { id: "bottom-right", label: "En bas à droite" },
]

function isDefaultManualCrop(crop?: ManualCropRect | null) {
  if (!crop) {
    return true
  }

  const normalized = normalizeManualCropRect(crop)

  return (
    normalized.x === DEFAULT_MANUAL_CROP_RECT.x &&
    normalized.y === DEFAULT_MANUAL_CROP_RECT.y &&
    normalized.width === DEFAULT_MANUAL_CROP_RECT.width &&
    normalized.height === DEFAULT_MANUAL_CROP_RECT.height
  )
}

function formatCropPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function formatCropInputValue(value: number) {
  return Math.round(value * 100)
}

function formatManualCropSummary(crop?: ManualCropRect | null) {
  if (!crop || isDefaultManualCrop(crop)) {
    return "Page entière"
  }

  const normalized = normalizeManualCropRect(crop)
  return `X ${formatCropPercent(normalized.x)} · Y ${formatCropPercent(normalized.y)} · L ${formatCropPercent(normalized.width)} · H ${formatCropPercent(normalized.height)}`
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value)
}

export function HomeTool() {
  const [files, setFiles] = useState<FileWithId[]>([])
  const [focusedFileId, setFocusedFileId] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<LabelProfileId>(LABEL_PROFILES[0].id)
  const [mondialRelayVariantId, setMondialRelayVariantId] = useState<MondialRelayVariantId>(
    DEFAULT_MONDIAL_RELAY_VARIANT_ID,
  )
  const [singleLabelSlot, setSingleLabelSlot] = useState<SingleLabelSlot>("top-right")
  const [manualCropsByFileId, setManualCropsByFileId] = useState<Record<string, ManualCropRect>>({})
  const [rotationsByFileId, setRotationsByFileId] = useState<Record<string, PdfRotation>>({})
  const [pageCounts, setPageCounts] = useState<Record<string, number>>({})
  const [manualPreview, setManualPreview] = useState<PreviewImage | null>(null)
  const [isLoadingManualPreview, setIsLoadingManualPreview] = useState(false)
  const [manualPreviewError, setManualPreviewError] = useState("")
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultError, setResultError] = useState("")
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [resultPreviewPage, setResultPreviewPage] = useState(1)
  const [resultPreviewPageCount, setResultPreviewPageCount] = useState(0)
  const [resultPreview, setResultPreview] = useState<PreviewImage | null>(null)
  const [isLoadingResultPreview, setIsLoadingResultPreview] = useState(false)
  const [resultPreviewError, setResultPreviewError] = useState("")
  const [accessSnapshot, setAccessSnapshot] = useState<AccessSnapshot | null>(null)
  const [isLoadingAccess, setIsLoadingAccess] = useState(true)
  const [accessError, setAccessError] = useState("")
  const [impactSnapshot, setImpactSnapshot] = useState<ImpactSnapshot | null>(null)
  const [impactError, setImpactError] = useState("")
  const [exportError, setExportError] = useState("")
  const [activeExportAction, setActiveExportAction] = useState<"download" | "print" | null>(null)
  const workspaceRef = useRef<HTMLElement | null>(null)
  const appendFilesInputRef = useRef<HTMLInputElement | null>(null)

  const baseSelectedProfile = LABEL_PROFILES.find((profile) => profile.id === profileId) ?? LABEL_PROFILES[0]
  const selectedProfile = getResolvedLabelProfile(profileId, { mondialRelayVariantId })
  const focusedFile = files.find((file) => file.id === focusedFileId) ?? files[0] ?? null
  const focusedFileIndex = focusedFile ? files.findIndex((file) => file.id === focusedFile.id) : -1
  const focusedManualCrop = focusedFile ? manualCropsByFileId[focusedFile.id] ?? DEFAULT_MANUAL_CROP_RECT : DEFAULT_MANUAL_CROP_RECT
  const focusedRotation = focusedFile ? rotationsByFileId[focusedFile.id] ?? 0 : 0
  const isSingleSourcePdf = files.length === 1
  const isMondialRelayProfile = baseSelectedProfile.id === "mondial-relay"
  const isManualProfile = selectedProfile.mode === "manual"
  const deferredManualCropsByFileId = useDeferredValue(manualCropsByFileId)
  const deferredRotationsByFileId = useDeferredValue(rotationsByFileId)
  const activeManualCropsByFileId = isManualProfile ? deferredManualCropsByFileId : undefined
  const usesImageResultPreview = isMobileViewport

  const totalLabels = useMemo(
    () => files.reduce((sum, file) => sum + (pageCounts[file.id] ?? 0), 0),
    [files, pageCounts],
  )
  const totalSheets = Math.ceil(totalLabels / 4)
  const currentImpact = useMemo(
    () =>
      calculateLabelImpact({
        labelCount: totalLabels,
        optimizedSheetCount: totalSheets,
      }),
    [totalLabels, totalSheets],
  )
  const estimatedSheetCountForExport = useMemo(() => {
    if (files.length === 0) {
      return 0
    }

    const labels = files.reduce((sum, file) => sum + Math.max(pageCounts[file.id] ?? 1, 1), 0)
    return Math.max(Math.ceil(labels / 4), 1)
  }, [files, pageCounts])
  const customManualCropCount = useMemo(
    () => files.reduce((sum, file) => sum + (manualCropsByFileId[file.id] ? 1 : 0), 0),
    [files, manualCropsByFileId],
  )
  const rotatedFileCount = useMemo(
    () => files.reduce((sum, file) => sum + ((rotationsByFileId[file.id] ?? 0) !== 0 ? 1 : 0), 0),
    [files, rotationsByFileId],
  )
  const premiumPlanLabel = accessSnapshot?.plan && accessSnapshot.plan !== "free" ? getPlanLabel(accessSnapshot.plan) : null

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
    const controller = new AbortController()
    let active = true

    fetch("/api/impact", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as ImpactResponsePayload

        if (!response.ok || !payload.impact) {
          throw new Error(payload.error ?? "Impossible de charger le compteur écologique.")
        }

        if (active) {
          setImpactSnapshot(payload.impact)
          setImpactError("")
        }
      })
      .catch((error) => {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) {
          return
        }

        reportClientError("impact-fetch", error)

        if (active) {
          setImpactError("Le compteur écologique sera mis à jour après votre prochain export.")
        }
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    setIsLoadingAccess(true)

    fetch("/api/access", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as AccessResponsePayload

        if (!response.ok || !payload.access) {
          throw new Error(payload.error ?? "Impossible de charger votre quota.")
        }

        if (active) {
          setAccessSnapshot(payload.access)
          setAccessError("")
        }
      })
      .catch((error) => {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) {
          return
        }

        reportClientError("access-fetch", error)

        if (active) {
          setAccessError(
            "Le statut gratuit/premium n'a pas pu être chargé. Les exports resteront revérifiés au moment du téléchargement.",
          )
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingAccess(false)
        }
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)
    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void
    }
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches)

    syncViewport()

    if ("addEventListener" in mediaQuery) {
      mediaQuery.addEventListener("change", syncViewport)
    } else {
      legacyMediaQuery.addListener?.(syncViewport)
    }

    return () => {
      if ("removeEventListener" in mediaQuery) {
        mediaQuery.removeEventListener("change", syncViewport)
      } else {
        legacyMediaQuery.removeListener?.(syncViewport)
      }
    }
  }, [])

  useEffect(() => {
    if (!result?.blob) {
      setResultPreviewPage(1)
      setResultPreviewPageCount(0)
      return
    }

    let active = true

    setResultPreviewPage(1)
    setResultPreviewPageCount(0)

    getPdfPageCount(result.blob)
      .then((pageCount) => {
        if (active) {
          setResultPreviewPageCount(pageCount)
        }
      })
      .catch(() => {
        if (active) {
          setResultPreviewPageCount(0)
        }
      })

    return () => {
      active = false
    }
  }, [result])

  useEffect(() => {
    if (!usesImageResultPreview || !result?.blob) {
      setResultPreview(null)
      setResultPreviewError("")
      setIsLoadingResultPreview(false)
      return
    }

    let active = true
    let previewUrl: string | null = null

    setIsLoadingResultPreview(true)
    setResultPreview(null)
    setResultPreviewError("")

    renderPdfPageToImage(result.blob, resultPreviewPage, 1.5)
      .then((preview) => {
        if (!active) {
          return
        }

        previewUrl = URL.createObjectURL(preview.blob)
        setResultPreview({
          url: previewUrl,
          width: preview.width,
          height: preview.height,
        })
      })
      .catch((error) => {
        if (active) {
          reportClientError("result-preview", error, { page: resultPreviewPage })
          setResultPreview(null)
          setResultPreviewError(error instanceof Error ? error.message : "Impossible de générer l’aperçu du résultat.")
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingResultPreview(false)
        }
      })

    return () => {
      active = false

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [result, resultPreviewPage, usesImageResultPreview])

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
    if (!isManualProfile || !focusedFile) {
      setManualPreview(null)
      setManualPreviewError("")
      setIsLoadingManualPreview(false)
      return
    }

    let active = true
    let previewUrl: string | null = null

    setIsLoadingManualPreview(true)
    setManualPreviewError("")

    renderPdfPageToImage(focusedFile, 1, 1.4)
      .then((preview) => {
        if (!active) {
          return
        }

        previewUrl = URL.createObjectURL(preview.blob)
        setManualPreview({
          url: previewUrl,
          width: preview.width,
          height: preview.height,
        })
      })
      .catch((error) => {
        if (active) {
          reportClientError("manual-preview", error, {
            fileName: focusedFile.name,
          })
          setManualPreview(null)
          setManualPreviewError(error instanceof Error ? error.message : "Impossible de générer l’aperçu du PDF.")
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingManualPreview(false)
        }
      })

    return () => {
      active = false

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [focusedFile, isManualProfile])

  useEffect(() => {
    if (files.length === 0) {
      setResult(null)
      setResultError("")
      setExportError("")
      return
    }

    let active = true
    setIsGenerating(true)
    setResultError("")
    setExportError("")

    buildLabelA4Pdf(files, profileId, {
      manualCropsByFileId: activeManualCropsByFileId,
      mondialRelayVariantId,
      rotationsByFileId: deferredRotationsByFileId,
      singleLabelSlot,
    })
      .then((blob) => {
        if (active) {
          setResult({
            blob,
            name: buildLabelPdfName(files, profileId, { mondialRelayVariantId }),
          })
        }
      })
      .catch((error) => {
        if (active) {
          reportClientError("result-build", error, {
            fileCount: files.length,
            profileId,
          })
          setResult(null)
          setResultError(error instanceof Error ? error.message : "Impossible de générer le PDF.")
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
  }, [activeManualCropsByFileId, deferredRotationsByFileId, files, mondialRelayVariantId, profileId, singleLabelSlot])

  const applyAccessSnapshot = (snapshot?: AccessSnapshot) => {
    if (!snapshot) {
      return
    }

    setAccessSnapshot(snapshot)
    setAccessError("")
  }

  const handleExportAction = async (action: "download" | "print") => {
    if (!result) {
      return
    }

    setActiveExportAction(action)
    setExportError("")

    try {
      const response = await fetch("/api/exports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          fileName: result.name,
          labelCount: Math.max(totalLabels, 1),
          sheetCount: estimatedSheetCountForExport || 1,
        }),
      })

      const payload = (await response.json()) as ExportResponsePayload
      applyAccessSnapshot(payload.snapshot)
      if (payload.impact) {
        setImpactSnapshot(payload.impact)
        setImpactError("")
      }

      if (!response.ok || !payload.allowed) {
        if (payload.reason === "quota-exceeded") {
          throw new Error(
            `Votre quota gratuit du jour est atteint. Passez en illimité pour exporter ${estimatedSheetCountForExport || 1} planche(s) A4 supplémentaire(s).`,
          )
        }

        if (payload.reason === "abuse-limit") {
          throw new Error(
            "Le quota invité de sécurité est atteint sur cette connexion. Connectez-vous pour retrouver un quota lié à votre compte.",
          )
        }

        throw new Error(payload.error ?? "Impossible de valider cet export.")
      }

      if (action === "download") {
        downloadBlob(result.blob, result.name)
      } else {
        await printBlob(result.blob, {
          preferImagePrint: isMobileViewport,
        })
      }
    } catch (error) {
      reportClientError("protected-export", error, {
        action,
        fileName: result.name,
        labelCount: Math.max(totalLabels, 1),
        sheetCount: estimatedSheetCountForExport || 1,
      })

      setExportError(error instanceof Error ? error.message : "Impossible de lancer cet export.")
    } finally {
      setActiveExportAction(null)
    }
  }

  const updateFiles = (nextFiles: FileWithId[]) => {
    setFiles(nextFiles)
    setFocusedFileId(
      (current) => nextFiles.find((file) => file.id === current)?.id ?? nextFiles[0]?.id ?? null,
    )
    setManualCropsByFileId((current) =>
      Object.fromEntries(
        nextFiles.flatMap((file) => {
          const crop = current[file.id]
          return crop ? [[file.id, crop] as const] : []
        }),
      ),
    )
    setRotationsByFileId((current) =>
      Object.fromEntries(
        nextFiles.flatMap((file) => {
          const rotation = current[file.id]
          return rotation ? [[file.id, rotation] as const] : []
        }),
      ),
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

  const setManualCropForFile = (fileId: string, crop: ManualCropRect) => {
    const normalized = normalizeManualCropRect(crop)

    setManualCropsByFileId((current) => {
      const next = { ...current }

      if (isDefaultManualCrop(normalized)) {
        delete next[fileId]
      } else {
        next[fileId] = normalized
      }

      return next
    })
  }

  const handleManualCropChange = (nextCrop: ManualCropRect) => {
    if (!focusedFile) {
      return
    }

    setManualCropForFile(focusedFile.id, nextCrop)
  }

  const resetFocusedManualCrop = () => {
    if (!focusedFile) {
      return
    }

    startTransition(() => {
      setManualCropsByFileId((current) => {
        const next = { ...current }
        delete next[focusedFile.id]
        return next
      })
    })
  }

  const applyFocusedCropToAllFiles = () => {
    const normalized = normalizeManualCropRect(focusedManualCrop)

    startTransition(() => {
      if (isDefaultManualCrop(normalized)) {
        setManualCropsByFileId({})
        return
      }

      setManualCropsByFileId(
        Object.fromEntries(files.map((file) => [file.id, normalized] as const)),
      )
    })
  }

  const setRotationForFile = (fileId: string, rotation: number) => {
    const normalized = normalizePdfRotation(rotation)

    startTransition(() => {
      setRotationsByFileId((current) => {
        const next = { ...current }

        if (normalized === 0) {
          delete next[fileId]
        } else {
          next[fileId] = normalized
        }

        return next
      })
    })
  }

  const rotateFocusedFile = (delta: -90 | 90) => {
    if (!focusedFile) {
      return
    }

    setRotationForFile(focusedFile.id, focusedRotation + delta)
  }

  const rotateFile = (fileId: string, delta: -90 | 90) => {
    setRotationForFile(fileId, (rotationsByFileId[fileId] ?? 0) + delta)
  }

  const applyRotationToAllFiles = (rotation: PdfRotation) => {
    startTransition(() => {
      if (rotation === 0) {
        setRotationsByFileId({})
        return
      }

      setRotationsByFileId(Object.fromEntries(files.map((file) => [file.id, rotation] as const)))
    })
  }

  const updateFocusedManualCropFromPercent =
    (field: keyof ManualCropRect) => (event: ChangeEvent<HTMLInputElement>) => {
      if (!focusedFile) {
        return
      }

      const numericValue = event.currentTarget.valueAsNumber
      if (Number.isNaN(numericValue)) {
        return
      }

      setManualCropForFile(focusedFile.id, {
        ...focusedManualCrop,
        [field]: numericValue / 100,
      })
    }

  const focusAdjacentFile = (direction: -1 | 1) => {
    const nextIndex = focusedFileIndex + direction
    if (nextIndex < 0 || nextIndex >= files.length) {
      return
    }

    setFocusedFileId(files[nextIndex].id)
  }

  const changeResultPreviewPage = (direction: -1 | 1) => {
    setResultPreviewPage((currentPage) => {
      const nextPage = currentPage + direction
      return Math.min(Math.max(nextPage, 1), resultPreviewPageCount || 1)
    })
  }

  const panelClass =
    "rounded-[30px] border border-white/70 bg-white/84 p-6 shadow-[0_30px_70px_-52px_rgba(15,23,42,0.42)] backdrop-blur-xl"
  const metricClass = "rounded-[22px] border border-slate-200/80 bg-slate-50/90 p-4"
  const pillButtonClass =
    "rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-800 disabled:opacity-40"

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-10 lg:pb-10">
      <section
        id="outil"
        className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/78 p-5 shadow-[0_42px_120px_-60px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:p-8 lg:p-10"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.2),transparent_56%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_36%)]" />
        <div className="pointer-events-none absolute -right-24 top-10 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-4xl">
            <span className="inline-flex items-center rounded-full border border-sky-200/80 bg-sky-100/80 px-4 py-1 text-sm font-medium text-sky-950 shadow-sm">
              Préparation d’étiquettes PDF
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-[3.55rem] lg:leading-[1.02]">
              Étiquettes PDF vers A4 x4, avec un rendu propre et prêt à imprimer
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Importez vos PDF, choisissez le bon rognage puis récupérez une planche A4 nette, adaptée aux formats
              transporteurs et aux cas manuels.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-700">
              <span className="rounded-full border border-slate-200/80 bg-white/85 px-4 py-2 shadow-sm">
                Chronopost, Colissimo, Mondial Relay, Happy Post
              </span>
              <span className="rounded-full border border-slate-200/80 bg-white/85 px-4 py-2 shadow-sm">
                Rognage manuel sur aperçu
              </span>
              <span className="rounded-full border border-slate-200/80 bg-white/85 px-4 py-2 shadow-sm">
                Placement A4 x4 automatique
              </span>
            </div>

            <div className="mt-6 rounded-[28px] border border-slate-200/80 bg-white/86 p-5 shadow-[0_22px_50px_-40px_rgba(15,23,42,0.28)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1.5">
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">
                    Gratuit et premium
                  </div>
                  <div className="text-base font-medium text-slate-900">
                    {isLoadingAccess
                      ? "Chargement de votre quota..."
                      : accessSnapshot?.isPremium
                        ? `${premiumPlanLabel ?? "Accès premium"} actif`
                        : `${accessSnapshot?.remainingSheetsToday ?? siteConfig.pricing.guestDailyA4Sheets} planche(s) A4 restante(s) aujourd'hui sur ${accessSnapshot?.dailyLimit ?? siteConfig.pricing.guestDailyA4Sheets}`}
                  </div>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600">
                    {accessSnapshot?.isPremium
                      ? "Les exports sont illimités tant que votre accès premium reste actif."
                      : `Passez en illimité dès ${formatEuroFromCents(siteConfig.pricing.monthlyPriceCents)} / mois ou prenez un pass 24h pour les gros lots ponctuels.`}
                  </p>
                  {accessSnapshot?.expiresAt && (
                    <p className="text-sm text-slate-500">
                      Accès actif jusqu'au {new Date(accessSnapshot.expiresAt).toLocaleString("fr-FR")}.
                    </p>
                  )}
                  {accessError && <p className="text-sm text-amber-700">{accessError}</p>}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/tarifs"
                    className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)]"
                    onClick={() => trackClientEvent("home_pricing_link_clicked", { path: window.location.pathname })}
                  >
                    Voir les tarifs
                  </Link>
                  <Link
                    href={accessSnapshot?.isPremium ? "/compte" : "/faq"}
                    className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)]"
                  >
                    {accessSnapshot?.isPremium ? "Ouvrir mon compte" : "Questions fréquentes"}
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-emerald-200/80 bg-emerald-50/80 p-4 text-emerald-950">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  <Leaf className="h-4 w-4" />
                  Plateforme
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {formatInteger(impactSnapshot?.platform.sheetsSaved ?? 0)}
                </div>
                <p className="mt-1 text-sm leading-5 text-emerald-900">feuilles A4 déjà économisées</p>
              </div>
              <div className="rounded-[22px] border border-slate-200/80 bg-white/86 p-4 text-slate-900">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Votre compteur</div>
                <div className="mt-2 text-2xl font-semibold">
                  {formatInteger(impactSnapshot?.individual.labelsOptimized ?? 0)}
                </div>
                <p className="mt-1 text-sm leading-5 text-slate-600">étiquettes optimisées et comptabilisées</p>
              </div>
              <div className="rounded-[22px] border border-slate-200/80 bg-white/86 p-4 text-slate-900">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Lot actuel</div>
                <div className="mt-2 text-2xl font-semibold">{formatInteger(currentImpact.sheetsSaved)}</div>
                <p className="mt-1 text-sm leading-5 text-slate-600">
                  feuilles économisées si vous exportez ce lot
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Moins de papier gaspillé, plus d'efficacité. Le calcul compare une étiquette seule par feuille avec une
              planche A4 x4.
            </p>
            {impactError && <p className="mt-2 text-sm text-amber-700">{impactError}</p>}
          </div>

          <label
            className={cn(
              "group relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[32px] border border-dashed border-sky-300/80 bg-[linear-gradient(165deg,rgba(255,255,255,0.95),rgba(241,245,249,0.94))] px-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_28px_80px_-56px_rgba(3,105,161,0.55)] transition duration-200",
              "hover:border-sky-500 hover:bg-white",
            )}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              addFiles(Array.from(event.dataTransfer.files))
            }}
          >
            <div className="pointer-events-none absolute inset-x-6 top-0 h-28 rounded-b-[30px] bg-[linear-gradient(180deg,rgba(14,165,233,0.12),transparent)]" />
            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
            />

            <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-[linear-gradient(180deg,#0f172a,#0369a1)] text-white shadow-[0_24px_60px_-34px_rgba(3,105,161,0.75)]">
              <Upload className="h-10 w-10" />
            </div>
            <h2 className="mt-6 text-[1.75rem] font-semibold tracking-tight text-slate-950">Déposez vos PDF</h2>
            <p className="mt-3 max-w-sm text-slate-600">
              L’ordre du lot est conservé, puis la sortie est recomposée sur feuille A4.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
              <span className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5">PDF uniquement</span>
              <span className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5">
                Sélection multiple
              </span>
            </div>
          </label>
        </div>

        <div className="relative mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {LABEL_PROFILES.map((profile) => (
            <button
              key={profile.id}
              type="button"
              className={cn(
                "rounded-[26px] border px-5 py-5 text-left transition duration-200",
                profileId === profile.id
                  ? "border-sky-400 bg-[linear-gradient(180deg,rgba(240,249,255,0.98),rgba(255,255,255,0.98))] shadow-[0_22px_48px_-34px_rgba(2,132,199,0.4)]"
                  : "border-slate-200/80 bg-white/82 hover:border-slate-300 hover:bg-white",
              )}
              onClick={() => setProfileId(profile.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-xl font-semibold text-slate-950">{profile.title}</div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
                    profile.mode === "manual" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800",
                  )}
                >
                  {profile.mode === "manual" ? "Manuel" : "Auto"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {profile.mode === "manual"
                  ? "Sélection directe sur l’aperçu du PDF."
                  : "Rognage transporteur appliqué automatiquement."}
              </p>
            </button>
          ))}
        </div>

        {isMondialRelayProfile && (
          <div className="relative mt-4 rounded-[28px] border border-slate-200/80 bg-white/82 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.2)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-950">Variantes Mondial Relay</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Choisissez la variante de rognage a appliquer au lot.
                </p>
              </div>
              <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                Variante active :{" "}
                {MONDIAL_RELAY_VARIANTS.find((variant) => variant.id === mondialRelayVariantId)?.title}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {MONDIAL_RELAY_VARIANTS.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  className={cn(
                    "rounded-[22px] border px-4 py-4 text-left transition duration-200",
                    mondialRelayVariantId === variant.id
                      ? "border-sky-400 bg-[linear-gradient(135deg,rgba(240,249,255,0.95),rgba(255,255,255,0.96))] shadow-[0_18px_40px_-34px_rgba(2,132,199,0.36)]"
                      : "border-slate-200/80 bg-slate-50/80 hover:border-slate-300 hover:bg-white",
                  )}
                  onClick={() => setMondialRelayVariantId(variant.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-950">{variant.title}</div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {variant.shortLabel}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">{variant.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {files.length > 0 && (
        <section ref={workspaceRef} className="mt-8 grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className={panelClass}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Lot source</h2>
                  <p className="mt-2 text-slate-600">
                    {files.length} fichier(s) · {totalLabels || "?"} étiquette(s) · {totalSheets || 0} feuille(s) A4
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={appendFilesInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      addFiles(Array.from(event.target.files ?? []))
                      event.currentTarget.value = ""
                    }}
                  />
                  <button
                    type="button"
                    className={pillButtonClass}
                    onClick={() => appendFilesInputRef.current?.click()}
                  >
                    <Upload className="mr-2 inline h-4 w-4" />
                    Ajouter des PDF
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-red-300 hover:text-red-600"
                    onClick={() => updateFiles([])}
                  >
                    Vider
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-slate-900">Rotation du lot</div>
                    <div className="mt-1 text-sm text-slate-500">
                      Appliquez un angle commun apres le rognage, puis ajustez fichier par fichier si besoin.
                    </div>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    {rotatedFileCount}/{files.length} fichier(s) pivotes
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {PDF_ROTATION_PRESETS.map((rotationPreset) => {
                    const allFilesUsePreset =
                      files.length > 0 &&
                      files.every((file) => (rotationsByFileId[file.id] ?? 0) === rotationPreset.value)

                    return (
                      <button
                        key={rotationPreset.value}
                        type="button"
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition",
                          allFilesUsePreset
                            ? "border-sky-400 bg-sky-50 text-sky-900"
                            : "border-slate-200/80 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-800",
                        )}
                        onClick={() => applyRotationToAllFiles(rotationPreset.value)}
                      >
                        Tout en {rotationPreset.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {files.map((file, index) => {
                  const hasCustomManualCrop = Boolean(manualCropsByFileId[file.id])
                  const fileRotation = rotationsByFileId[file.id] ?? 0

                  return (
                    <div
                      key={file.id}
                      className={cn(
                        "flex flex-col gap-4 rounded-[24px] border px-4 py-4 transition duration-200 sm:flex-row sm:items-center",
                        focusedFile?.id === file.id
                          ? "border-sky-400 bg-[linear-gradient(135deg,rgba(240,249,255,0.9),rgba(255,255,255,0.95))] shadow-[0_20px_44px_-34px_rgba(2,132,199,0.38)]"
                          : "border-slate-200/80 bg-white/70 hover:border-slate-300 hover:bg-white",
                      )}
                    >
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        onClick={() => setFocusedFileId(file.id)}
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-sky-100 text-sky-800">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-950">{file.name}</div>
                          <div className="text-sm text-slate-500">
                            {formatFileSize(file.size)} · {pageCounts[file.id] ?? "?"} page(s)
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 font-medium",
                                fileRotation === 0 ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800",
                              )}
                            >
                              Rotation {fileRotation}
                              {"\u00B0"}
                            </span>
                          </div>
                          {isManualProfile && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-1 font-medium",
                                  hasCustomManualCrop ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-600",
                                )}
                              >
                                {hasCustomManualCrop ? "Zone personnalisée" : "Page entière"}
                              </span>
                              {focusedFile?.id === file.id && (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                                  Aperçu actif
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200/80 bg-white/80 p-2 text-slate-600 transition hover:border-sky-300 hover:text-sky-800"
                          onClick={() => rotateFile(file.id, -90)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-800"
                          onClick={() => setRotationForFile(file.id, 0)}
                        >
                          {"0\u00B0"}
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200/80 bg-white/80 p-2 text-slate-600 transition hover:border-sky-300 hover:text-sky-800"
                          onClick={() => rotateFile(file.id, 90)}
                        >
                          <RotateCw className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200/80 bg-white/80 p-2 text-slate-600 transition hover:border-sky-300 hover:text-sky-800 disabled:opacity-40"
                          disabled={index === 0}
                          onClick={() => moveFile(index, -1)}
                        >
                          <MoveUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200/80 bg-white/80 p-2 text-slate-600 transition hover:border-sky-300 hover:text-sky-800 disabled:opacity-40"
                          disabled={index === files.length - 1}
                          onClick={() => moveFile(index, 1)}
                        >
                          <MoveDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200/80 bg-white/80 p-2 text-red-600 transition hover:border-red-300"
                          onClick={() => updateFiles(files.filter((current) => current.id !== file.id))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {isManualProfile && (
              <div className={panelClass}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">Rognage manuel par fichier</h2>
                    <p className="mt-2 max-w-2xl text-slate-600">
                      Chaque PDF garde sa propre zone. Sélectionnez un fichier dans le lot, ajustez sa zone, puis
                      passez au suivant. Si plusieurs PDF partagent le même format, vous pouvez recopier la zone active
                      sur tout le lot en un clic.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {files.length > 1 && (
                      <>
                        <button
                          type="button"
                          className={pillButtonClass}
                          disabled={focusedFileIndex <= 0}
                          onClick={() => focusAdjacentFile(-1)}
                        >
                          Précédent
                        </button>
                        <button
                          type="button"
                          className={pillButtonClass}
                          disabled={focusedFileIndex < 0 || focusedFileIndex >= files.length - 1}
                          onClick={() => focusAdjacentFile(1)}
                        >
                          Suivant
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className={pillButtonClass}
                      disabled={!focusedFile}
                      onClick={() => rotateFocusedFile(-90)}
                    >
                      <RotateCcw className="mr-2 inline h-4 w-4" />
                      {"-90\u00B0"}
                    </button>
                    <button
                      type="button"
                      className={pillButtonClass}
                      disabled={!focusedFile}
                      onClick={() => focusedFile && setRotationForFile(focusedFile.id, 0)}
                    >
                      Rotation {focusedRotation}
                      {"\u00B0"}
                    </button>
                    <button
                      type="button"
                      className={pillButtonClass}
                      disabled={!focusedFile}
                      onClick={() => rotateFocusedFile(90)}
                    >
                      <RotateCw className="mr-2 inline h-4 w-4" />
                      {"+90\u00B0"}
                    </button>
                    <button
                      type="button"
                      className={pillButtonClass}
                      disabled={files.length === 0}
                      onClick={applyFocusedCropToAllFiles}
                    >
                      Appliquer cette zone à tout le lot
                    </button>
                    <button
                      type="button"
                      className={pillButtonClass}
                      disabled={!focusedFile}
                      onClick={resetFocusedManualCrop}
                    >
                      Réinitialiser ce fichier
                    </button>
                  </div>
                </div>

                {focusedFile && (
                  <p className="mt-4 text-sm text-slate-500">
                    Fichier actif : <span className="font-medium text-slate-700">{focusedFile.name}</span>
                    {files.length > 1 && focusedFileIndex >= 0 && (
                      <span> · {focusedFileIndex + 1}/{files.length}</span>
                    )}
                  </p>
                )}

                <div className="mt-5">
                  {manualPreview ? (
                    <ManualCropEditor
                      imageHeight={manualPreview.height}
                      imageUrl={manualPreview.url}
                      imageWidth={manualPreview.width}
                      onChange={handleManualCropChange}
                      value={focusedManualCrop}
                    />
                  ) : (
                    <div className="flex min-h-[320px] items-center justify-center rounded-[26px] border border-dashed border-slate-300 bg-slate-50/90 px-6 text-center text-slate-500">
                      {isLoadingManualPreview
                        ? "Chargement de l’aperçu du PDF…"
                        : manualPreviewError || "Aucun aperçu disponible pour le moment."}
                    </div>
                  )}
                </div>

                {manualPreviewError && (
                  <div className="mt-4 rounded-[24px] border border-amber-200 bg-amber-50/90 p-4 text-sm leading-6 text-amber-900">
                    L'aperçu du PDF a échoué. Vérifiez que le fichier n'est pas corrompu, puis réessayez. Si le
                    problème persiste, utilisez la page{" "}
                    <Link href="/contact" className="font-medium underline">
                      Support
                    </Link>
                    .
                  </div>
                )}

                <p className="mt-4 text-sm text-slate-500">
                  Sur mobile, affinez aussi la zone avec les champs ci-dessous pour éviter les manipulations trop fines
                  au doigt.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <div className={cn(metricClass, "col-span-2 lg:col-span-1")}>
                    <div className="text-sm text-slate-500">État</div>
                    <div className="mt-1 font-medium text-slate-900">
                      {isDefaultManualCrop(focusedManualCrop) ? "Page entière" : "Zone personnalisée"}
                    </div>
                  </div>
                  <div className={metricClass}>
                    <div className="text-sm text-slate-500">X</div>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      step={1}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base font-medium text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      value={formatCropInputValue(focusedManualCrop.x)}
                      onChange={updateFocusedManualCropFromPercent("x")}
                    />
                  </div>
                  <div className={metricClass}>
                    <div className="text-sm text-slate-500">Y</div>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      step={1}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base font-medium text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      value={formatCropInputValue(focusedManualCrop.y)}
                      onChange={updateFocusedManualCropFromPercent("y")}
                    />
                  </div>
                  <div className={metricClass}>
                    <div className="text-sm text-slate-500">Largeur</div>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={1}
                      max={100}
                      step={1}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base font-medium text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      value={formatCropInputValue(focusedManualCrop.width)}
                      onChange={updateFocusedManualCropFromPercent("width")}
                    />
                  </div>
                  <div className={metricClass}>
                    <div className="text-sm text-slate-500">Hauteur</div>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={1}
                      max={100}
                      step={1}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base font-medium text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      value={formatCropInputValue(focusedManualCrop.height)}
                      onChange={updateFocusedManualCropFromPercent("height")}
                    />
                  </div>
                </div>
              </div>
            )}

            {isSingleSourcePdf && (
              <div className={panelClass}>
                <h2 className="text-xl font-semibold text-slate-950">Placement de l’étiquette unique</h2>
                <p className="mt-2 text-slate-600">Avec un seul PDF, choisissez le quart de feuille A4 à utiliser.</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {SINGLE_LABEL_PLACEMENTS.map((placement) => (
                    <button
                      key={placement.id}
                      type="button"
                      className={cn(
                        "rounded-[22px] border px-4 py-4 text-left text-sm font-medium transition duration-200",
                        singleLabelSlot === placement.id
                          ? "border-sky-400 bg-[linear-gradient(135deg,rgba(240,249,255,0.95),rgba(255,255,255,0.95))] text-sky-900 shadow-[0_18px_40px_-34px_rgba(2,132,199,0.42)]"
                          : "border-slate-200/80 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-white",
                      )}
                      onClick={() => setSingleLabelSlot(placement.id)}
                    >
                      {placement.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={panelClass}>
              <h2 className="text-xl font-semibold text-slate-950">Traitement appliqué</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className={metricClass}>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Étape 1</div>
                  <div className="mt-2 text-sm font-medium text-slate-800">Fusion</div>
                </div>
                <div className={metricClass}>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Étape 2</div>
                  <div className="mt-2 text-sm font-medium text-slate-800">Rognage {selectedProfile.shortLabel}</div>
                </div>
                <div className={metricClass}>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Étape 3</div>
                  <div className="mt-2 text-sm font-medium text-slate-800">Mise à l’échelle auto</div>
                </div>
                <div className={metricClass}>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Étape 4</div>
                  <div className="mt-2 text-sm font-medium text-slate-800">Placement A4 x4</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
            <div className={panelClass}>
              <h2 className="text-xl font-semibold text-slate-950">Résultat final</h2>
              <p className="mt-2 text-slate-600">
                {isSingleSourcePdf
                  ? "Sortie sur le quart de feuille A4 choisi."
                  : "Sortie composée par 4 sur feuille A4."}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
                <div className={metricClass}>
                  <div className="text-sm text-slate-500">Profil</div>
                  <div className="mt-1 font-medium text-slate-900">{selectedProfile.shortLabel}</div>
                </div>
                <div className={metricClass}>
                  <div className="text-sm text-slate-500">Étiquettes</div>
                  <div className="mt-1 font-medium text-slate-900">{totalLabels || 0}</div>
                </div>
                <div className={metricClass}>
                  <div className="text-sm text-slate-500">Feuilles A4</div>
                  <div className="mt-1 font-medium text-slate-900">{totalSheets || 0}</div>
                </div>
              </div>

              {rotatedFileCount > 0 && (
                <div className={cn("mt-3", metricClass)}>
                  <div className="text-sm text-slate-500">Rotation</div>
                  <div className="mt-1 font-medium text-slate-900">
                    {rotatedFileCount}/{files.length} fichier(s) avec une orientation adaptee
                  </div>
                </div>
              )}

              {isManualProfile && (
                <div className={cn("mt-3", metricClass)}>
                  <div className="text-sm text-slate-500">Rognages manuels</div>
                  <div className="mt-1 font-medium text-slate-900">
                    {customManualCropCount}/{files.length} fichier(s) avec une zone personnalisée
                  </div>
                  {focusedFile && (
                    <div className="mt-2 text-sm text-slate-600">
                      {focusedFile.name} : {formatManualCropSummary(manualCropsByFileId[focusedFile.id])}
                    </div>
                  )}
                </div>
              )}

              {isSingleSourcePdf && (
                <div className={cn("mt-3", metricClass)}>
                  <div className="text-sm text-slate-500">Position</div>
                  <div className="mt-1 font-medium text-slate-900">
                    {SINGLE_LABEL_PLACEMENTS.find((placement) => placement.id === singleLabelSlot)?.label}
                  </div>
                </div>
              )}

              <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(241,245,249,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                {usesImageResultPreview ? (
                  <div className="p-4">
                    {resultPreviewPageCount > 1 && (
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          className={pillButtonClass}
                          disabled={resultPreviewPage <= 1}
                          onClick={() => changeResultPreviewPage(-1)}
                        >
                          Feuille précédente
                        </button>
                        <div className="text-sm font-medium text-slate-600">
                          Feuille {resultPreviewPage}/{resultPreviewPageCount}
                        </div>
                        <button
                          type="button"
                          className={pillButtonClass}
                          disabled={resultPreviewPage >= resultPreviewPageCount}
                          onClick={() => changeResultPreviewPage(1)}
                        >
                          Feuille suivante
                        </button>
                      </div>
                    )}

                    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)]">
                      {resultPreview ? (
                        <img
                          src={resultPreview.url}
                          alt={`Aperçu de la feuille ${resultPreviewPage}`}
                          className="block h-auto w-full"
                        />
                      ) : (
                        <div className="flex min-h-[360px] items-center justify-center px-6 text-center text-slate-500">
                          {isLoadingResultPreview
                            ? "Prévisualisation du résultat..."
                            : resultPreviewError || resultError || "Aucun résultat pour le moment."}
                        </div>
                      )}
                    </div>

                    <p className="mt-4 text-sm text-slate-500">
                      Sur mobile, l’aperçu est rendu en image à partir du PDF final pour refléter fidèlement la sortie.
                    </p>
                  </div>
                ) : resultUrl ? (
                  <iframe
                    title="Aperçu du PDF généré"
                    src={`${resultUrl}#toolbar=0&navpanes=0&view=FitH`}
                    className="h-[780px] w-full border-0"
                  />
                ) : (
                  <div className="flex h-[780px] items-center justify-center px-6 text-center text-slate-500">
                    {isGenerating ? "Génération du PDF..." : resultError || "Aucun résultat pour le moment."}
                  </div>
                )}
              </div>

              {(resultError || exportError) && (
                <div className="mt-4 rounded-[24px] border border-amber-200 bg-amber-50/90 p-4 text-sm leading-6 text-amber-900">
                  <div className="font-semibold">Export ou génération interrompu</div>
                  <p className="mt-1">{exportError || resultError}</p>
                  <p className="mt-2">
                    Vous pouvez retenter avec un autre PDF, consulter les{" "}
                    <Link href="/faq" className="font-medium underline">
                      questions fréquentes
                    </Link>
                    {" "}ou contacter{" "}
                    <a href={`mailto:${siteConfig.supportEmail}`} className="font-medium underline">
                      {siteConfig.supportEmail}
                    </a>
                    .
                  </p>
                </div>
              )}

              {result && currentImpact.labelsOptimized > 0 && (
                <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50/90 p-4 text-sm leading-6 text-emerald-950">
                  <div className="font-semibold">Impact du PDF prêt à exporter</div>
                  <p className="mt-1">
                    {formatInteger(currentImpact.labelsOptimized)} étiquette(s) sur{" "}
                    {formatInteger(currentImpact.optimizedSheets)} feuille(s) A4, soit{" "}
                    {formatInteger(currentImpact.sheetsSaved)} feuille(s) économisée(s) par rapport à une impression
                    une étiquette par feuille.
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  className="inline-flex items-center rounded-full bg-[linear-gradient(135deg,#0f172a,#0369a1)] px-5 py-3 font-medium text-white shadow-[0_22px_46px_-26px_rgba(3,105,161,0.75)] transition hover:brightness-110 disabled:opacity-50"
                  disabled={!result || activeExportAction !== null}
                  onClick={() => handleExportAction("download")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {activeExportAction === "download" ? "Validation..." : "Télécharger le PDF A4"}
                </button>
                <button
                  type="button"
                  className="hidden items-center rounded-full border border-slate-200/80 bg-white px-5 py-3 font-medium text-slate-800 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)] transition hover:border-sky-300 hover:text-sky-800 disabled:opacity-50 lg:inline-flex"
                  disabled={!result || activeExportAction !== null}
                  onClick={() => handleExportAction("print")}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {activeExportAction === "print" ? "Validation..." : "Imprimer"}
                </button>
                <div className="text-sm text-slate-500">
                  {isGenerating ? "Recalcul en cours..." : result?.name ?? "En attente de génération"}
                  {accessSnapshot && !accessSnapshot.isPremium && (
                    <span className="block text-xs text-slate-400">
                      Quota restant aujourd'hui : {accessSnapshot.remainingSheetsToday}/{accessSnapshot.dailyLimit}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mt-8 rounded-[28px] border border-slate-200/80 bg-white/70 p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.28)] sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Imprimer plusieurs étiquettes colis sur une feuille A4
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Label2A4 transforme vos étiquettes PDF Chronopost, Colissimo, Mondial Relay et Happy Post en planches A4 x4.
              Pratique pour les ventes Vinted, Leboncoin et les expéditions régulières, sans modifier votre workflow
              d&apos;upload, de rognage et d&apos;impression.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/landing"
              className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-900 transition hover:border-sky-300 hover:bg-white"
            >
              Lire le guide A4
            </Link>
            <Link
              href="/mondial-relay"
              className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:text-sky-800"
            >
              Guide Mondial Relay
            </Link>
          </div>
        </div>
      </section>

      {files.length > 0 && (
        <div className="fixed inset-x-3 bottom-3 z-30 xl:hidden">
          <div className="rounded-[24px] border border-white/70 bg-slate-950/92 p-3 text-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.8)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-[0.16em] text-sky-200">
                  {isGenerating ? "Génération en cours" : `${totalSheets || 0} feuille(s) A4`}
                </div>
                <div className="truncate text-sm font-medium text-white/90">
                  {result?.name ?? "Préparation du PDF..."}
                </div>
              </div>
              <button
                type="button"
                className="inline-flex items-center rounded-full bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
                disabled={!result || activeExportAction !== null}
                onClick={() => handleExportAction("download")}
              >
                <Download className="mr-2 h-4 w-4" />
                {activeExportAction === "download" ? "Validation..." : "Télécharger"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
