import { degrees, PDFDocument } from "pdf-lib"
import {
  DEFAULT_MANUAL_CROP_RECT,
  getResolvedLabelProfile,
  type LabelCropRule,
  type LabelProfileId,
  type ManualCropRect,
  type MondialRelayVariantId,
} from "@/lib/label-profiles"

const A4_PORTRAIT = { width: 595.28, height: 841.89 }
const PAGE_MARGIN = 18
const GRID_GAP = 12
const ROWS = 2
const COLUMNS = 2
const MIN_CROP_SIZE = 0.01

// The user wants labels to fill the A4 in this exact order.
const SLOT_ORDER = [1, 0, 3, 2] as const
const PDF_ROTATIONS = [0, 90, 180, 270] as const

export type SingleLabelSlot = "top-right" | "top-left" | "bottom-right" | "bottom-left"
export type PdfRotation = (typeof PDF_ROTATIONS)[number]

type PdfInputFile = File & { id?: string }

export interface BuildLabelOptions {
  singleLabelSlot?: SingleLabelSlot
  manualCrop?: ManualCropRect | null
  manualCropsByFileId?: Record<string, ManualCropRect>
  mondialRelayVariantId?: MondialRelayVariantId
  rotationsByFileId?: Record<string, PdfRotation>
}

const SINGLE_LABEL_SLOT_MAP: Record<SingleLabelSlot, number> = {
  "top-right": 1,
  "top-left": 0,
  "bottom-right": 3,
  "bottom-left": 2,
}

function sanitizePdfName(name: string) {
  return name.toLowerCase().endsWith(".pdf") ? name.slice(0, -4) : name
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function normalizePdfRotation(rotation: number): PdfRotation {
  const normalized = ((Math.round(rotation / 90) * 90) % 360 + 360) % 360
  return (PDF_ROTATIONS.find((value) => value === normalized) ?? 0) as PdfRotation
}

function applyCropBox(
  page: {
    translateContent: (x: number, y: number) => void
    resetPosition?: () => void
    setMediaBox: (x: number, y: number, width: number, height: number) => void
    setCropBox?: (x: number, y: number, width: number, height: number) => void
    setTrimBox?: (x: number, y: number, width: number, height: number) => void
    setBleedBox?: (x: number, y: number, width: number, height: number) => void
    setArtBox?: (x: number, y: number, width: number, height: number) => void
  },
  x0: number,
  y0: number,
  width: number,
  height: number,
) {
  if (width <= 0 || height <= 0) {
    throw new Error("Le rognage produit une page vide.")
  }

  page.translateContent(-x0, -y0)
  page.resetPosition?.()
  page.setMediaBox(0, 0, width, height)
  page.setCropBox?.(0, 0, width, height)
  page.setTrimBox?.(0, 0, width, height)
  page.setBleedBox?.(0, 0, width, height)
  page.setArtBox?.(0, 0, width, height)

  return { width, height }
}

function normalizeCropRule(cropRule: LabelCropRule): Required<LabelCropRule> {
  return {
    side: cropRule.side,
    portion: clamp(cropRule.portion, MIN_CROP_SIZE, 1),
    verticalSide: cropRule.verticalSide ?? "bottom",
    verticalPortion: clamp(cropRule.verticalPortion ?? 1, MIN_CROP_SIZE, 1),
  }
}

export function normalizeManualCropRect(cropRect: ManualCropRect): ManualCropRect {
  const x = clamp(cropRect.x, 0, 1 - MIN_CROP_SIZE)
  const y = clamp(cropRect.y, 0, 1 - MIN_CROP_SIZE)
  const width = clamp(cropRect.width, MIN_CROP_SIZE, 1 - x)
  const height = clamp(cropRect.height, MIN_CROP_SIZE, 1 - y)

  return {
    x,
    y,
    width,
    height,
  }
}

function cropPageToRule(
  page: {
    getWidth: () => number
    getHeight: () => number
    translateContent: (x: number, y: number) => void
    resetPosition?: () => void
    setMediaBox: (x: number, y: number, width: number, height: number) => void
    setCropBox?: (x: number, y: number, width: number, height: number) => void
    setTrimBox?: (x: number, y: number, width: number, height: number) => void
    setBleedBox?: (x: number, y: number, width: number, height: number) => void
    setArtBox?: (x: number, y: number, width: number, height: number) => void
  },
  cropRule: LabelCropRule,
) {
  const rule = normalizeCropRule(cropRule)
  const pageWidth = page.getWidth()
  const pageHeight = page.getHeight()

  const keptWidth = pageWidth * rule.portion
  const keptHeight = pageHeight * rule.verticalPortion
  const x0 = rule.side === "right" ? pageWidth * (1 - rule.portion) : 0
  const y0 = rule.verticalSide === "top" ? pageHeight - keptHeight : 0

  return applyCropBox(page, x0, y0, keptWidth, keptHeight)
}

function cropPageToManualRect(
  page: {
    getWidth: () => number
    getHeight: () => number
    translateContent: (x: number, y: number) => void
    resetPosition?: () => void
    setMediaBox: (x: number, y: number, width: number, height: number) => void
    setCropBox?: (x: number, y: number, width: number, height: number) => void
    setTrimBox?: (x: number, y: number, width: number, height: number) => void
    setBleedBox?: (x: number, y: number, width: number, height: number) => void
    setArtBox?: (x: number, y: number, width: number, height: number) => void
  },
  cropRect: ManualCropRect,
) {
  const rect = normalizeManualCropRect(cropRect)
  const pageWidth = page.getWidth()
  const pageHeight = page.getHeight()
  const x0 = pageWidth * rect.x
  const y0 = pageHeight * (1 - rect.y - rect.height)
  const width = pageWidth * rect.width
  const height = pageHeight * rect.height

  return applyCropBox(page, x0, y0, width, height)
}

function getSlotRect(slotIndex: number) {
  const availableWidth = A4_PORTRAIT.width - PAGE_MARGIN * 2
  const availableHeight = A4_PORTRAIT.height - PAGE_MARGIN * 2
  const slotWidth = (availableWidth - GRID_GAP) / COLUMNS
  const slotHeight = (availableHeight - GRID_GAP) / ROWS
  const row = Math.floor(slotIndex / COLUMNS)
  const column = slotIndex % COLUMNS

  return {
    x: PAGE_MARGIN + column * (slotWidth + GRID_GAP),
    y: A4_PORTRAIT.height - PAGE_MARGIN - (row + 1) * slotHeight - row * GRID_GAP,
    width: slotWidth,
    height: slotHeight,
  }
}

function getRotatedSize(size: { width: number; height: number }, rotation: PdfRotation) {
  if (rotation === 90 || rotation === 270) {
    return {
      width: size.height,
      height: size.width,
    }
  }

  return size
}

function getRotationDrawOffset(
  rotation: PdfRotation,
  size: { width: number; height: number },
  scale: number,
) {
  if (rotation === 90) {
    return {
      x: 0,
      y: size.width * scale,
    }
  }

  if (rotation === 180) {
    return {
      x: size.width * scale,
      y: size.height * scale,
    }
  }

  if (rotation === 270) {
    return {
      x: size.height * scale,
      y: 0,
    }
  }

  return { x: 0, y: 0 }
}

export async function getPdfPageCount(file: Blob) {
  const bytes = await file.arrayBuffer()
  const document = await PDFDocument.load(bytes)
  return document.getPageCount()
}

export async function buildLabelA4Pdf(
  files: PdfInputFile[],
  profileId: LabelProfileId,
  options: BuildLabelOptions = {},
) {
  if (files.length === 0) {
    throw new Error("Ajoutez au moins un PDF.")
  }

  const profile = getResolvedLabelProfile(profileId, {
    mondialRelayVariantId: options.mondialRelayVariantId,
  })
  const manualCropsByFileId = options.manualCropsByFileId ?? {}
  const fallbackManualCrop = options.manualCrop ?? DEFAULT_MANUAL_CROP_RECT
  const rotationsByFileId = options.rotationsByFileId ?? {}
  const output = await PDFDocument.create()
  let currentSheet = output.addPage([A4_PORTRAIT.width, A4_PORTRAIT.height])
  let itemIndex = 0

  for (const file of files) {
    const source = await PDFDocument.load(await file.arrayBuffer())
    const copiedPages = await output.copyPages(source, source.getPageIndices())

    for (const copiedPage of copiedPages) {
      const rotation = normalizePdfRotation((file.id ? rotationsByFileId[file.id] : undefined) ?? 0)
      let croppedSize: { width: number; height: number }

      if (profile.mode === "manual") {
        const fileCrop = (file.id ? manualCropsByFileId[file.id] : undefined) ?? fallbackManualCrop
        croppedSize = cropPageToManualRect(copiedPage, fileCrop)
      } else if ("cropRect" in profile && profile.cropRect) {
        croppedSize = cropPageToManualRect(copiedPage, profile.cropRect)
      } else if ("crop" in profile && profile.crop) {
        croppedSize = cropPageToRule(copiedPage, profile.crop)
      } else {
        throw new Error("Le profil de rognage est incomplet.")
      }

      const embeddedPage = await output.embedPage(copiedPage)
      const isSingleSourcePdf = files.length === 1
      const slotIndex =
        isSingleSourcePdf && options.singleLabelSlot
          ? SINGLE_LABEL_SLOT_MAP[options.singleLabelSlot]
          : SLOT_ORDER[itemIndex % 4]
      const slot = getSlotRect(slotIndex)
      const rotatedSize = getRotatedSize(croppedSize, rotation)
      const scale = Math.min(slot.width / rotatedSize.width, slot.height / rotatedSize.height)
      const drawWidth = rotatedSize.width * scale
      const drawHeight = rotatedSize.height * scale
      const x = slot.x + (slot.width - drawWidth) / 2
      const y = slot.y + (slot.height - drawHeight) / 2
      const drawOffset = getRotationDrawOffset(rotation, croppedSize, scale)

      currentSheet.drawPage(embeddedPage, {
        x: x + drawOffset.x,
        y: y + drawOffset.y,
        xScale: scale,
        yScale: scale,
        rotate: degrees(-rotation),
      })

      itemIndex += 1
      if (itemIndex % 4 === 0) {
        currentSheet = output.addPage([A4_PORTRAIT.width, A4_PORTRAIT.height])
      }
    }
  }

  if (itemIndex > 0 && itemIndex % 4 === 0) {
    output.removePage(output.getPageCount() - 1)
  }

  const bytes = await output.save()
  const blobBytes = new Uint8Array(bytes.byteLength)
  blobBytes.set(bytes)

  return new Blob([blobBytes], {
    type: "application/pdf",
  })
}

export function buildLabelPdfName(
  files: File[],
  profileId: LabelProfileId,
  options: { mondialRelayVariantId?: MondialRelayVariantId } = {},
) {
  const profile = getResolvedLabelProfile(profileId, {
    mondialRelayVariantId: options.mondialRelayVariantId,
  })
  return `${sanitizePdfName(files[0].name)}_${profile.slug}_a4_x4.pdf`
}
