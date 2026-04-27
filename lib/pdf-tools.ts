import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib"
import {
  DEFAULT_MANUAL_CROP_RECT,
  getResolvedLabelProfile,
  type ChronopostVariantId,
  type LabelCropRule,
  type LabelProfileId,
  type ManualCropRect,
  type MondialRelayVariantId,
} from "@/lib/label-profiles"

export const PDF_TOOL_ERROR_MESSAGES = {
  emptyCrop: "pdf-tool/empty-crop",
  incompleteProfile: "pdf-tool/incomplete-profile",
  noLabelPage: "pdf-tool/no-label-page",
  noPdf: "pdf-tool/no-pdf",
} as const

const A4_PORTRAIT = { width: 595.28, height: 841.89 }
const PAGE_MARGIN = 18
const GRID_GAP = 12
const ROWS = 2
const COLUMNS = 2
const MIN_CROP_SIZE = 0.01
const BRAND_SIGNATURE_TEXT = "Imprimé avec Label2A4"
const BRAND_SIGNATURE_LOGO_URL = "/images/logo/label2a4-mark.png"
const BRAND_SIGNATURE_RESERVED_HEIGHT = 13

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
  chronopostVariantId?: ChronopostVariantId
  includeBrandSignature?: boolean
  mondialRelayVariantId?: MondialRelayVariantId
  rotationsByFileId?: Record<string, PdfRotation>
  selectedPageIndicesByFileId?: Record<string, number[]>
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

function getSelectedPageIndices(pageCount: number, selectedPageIndices?: number[]) {
  if (!selectedPageIndices) {
    return Array.from({ length: pageCount }, (_, index) => index)
  }

  return Array.from(
    new Set(
      selectedPageIndices.filter(
        (pageIndex) => Number.isInteger(pageIndex) && pageIndex >= 0 && pageIndex < pageCount,
      ),
    ),
  ).sort((first, second) => first - second)
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
    throw new Error(PDF_TOOL_ERROR_MESSAGES.emptyCrop)
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

async function fetchBrandSignatureLogo() {
  try {
    const response = await fetch(BRAND_SIGNATURE_LOGO_URL)

    if (!response.ok) {
      return null
    }

    return new Uint8Array(await response.arrayBuffer())
  } catch {
    return null
  }
}

async function getBrandSignatureAssets(output: PDFDocument) {
  const logoBytes = await fetchBrandSignatureLogo()
  const logo = logoBytes ? await output.embedPng(logoBytes) : null

  return {
    font: await output.embedFont(StandardFonts.Helvetica),
    logo,
  }
}

function drawBrandSignature({
  assets,
  page,
  slot,
}: {
  assets: Awaited<ReturnType<typeof getBrandSignatureAssets>>
  page: ReturnType<PDFDocument["addPage"]>
  slot: ReturnType<typeof getSlotRect>
}) {
  const fontSize = 6.5
  const logoSize = 8
  const gap = 3
  const { font, logo } = assets
  const textWidth = font.widthOfTextAtSize(BRAND_SIGNATURE_TEXT, fontSize)
  const signatureWidth = (logo ? logoSize + gap : 0) + textWidth
  const x = slot.x + slot.width - signatureWidth - 4
  const y = slot.y + 3
  const color = rgb(0.45, 0.5, 0.58)

  if (logo) {
    page.drawImage(logo, {
      x,
      y: y - 1,
      width: logoSize,
      height: logoSize,
      opacity: 0.7,
    })
  }

  page.drawText(BRAND_SIGNATURE_TEXT, {
    x: logo ? x + logoSize + gap : x,
    y,
    size: fontSize,
    font,
    color,
    opacity: 0.82,
  })
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
    throw new Error(PDF_TOOL_ERROR_MESSAGES.noPdf)
  }

  const profile = getResolvedLabelProfile(profileId, {
    chronopostVariantId: options.chronopostVariantId,
    mondialRelayVariantId: options.mondialRelayVariantId,
  })
  const manualCropsByFileId = options.manualCropsByFileId ?? {}
  const fallbackManualCrop = options.manualCrop ?? DEFAULT_MANUAL_CROP_RECT
  const rotationsByFileId = options.rotationsByFileId ?? {}
  const defaultRotation = normalizePdfRotation(profile.mode === "preset" ? profile.defaultRotation ?? 0 : 0)
  const selectedPageIndicesByFileId = options.selectedPageIndicesByFileId ?? {}
  const preparedSources = await Promise.all(
    files.map(async (file) => {
      const source = await PDFDocument.load(await file.arrayBuffer())
      const pageIndices = getSelectedPageIndices(
        source.getPageCount(),
        file.id ? selectedPageIndicesByFileId[file.id] : undefined,
      )

      return {
        file,
        pageIndices,
        source,
      }
    }),
  )
  const totalSelectedPageCount = preparedSources.reduce((sum, item) => sum + item.pageIndices.length, 0)

  if (totalSelectedPageCount === 0) {
    throw new Error(PDF_TOOL_ERROR_MESSAGES.noLabelPage)
  }

  const shouldUseSingleLabelSlot = totalSelectedPageCount === 1 && Boolean(options.singleLabelSlot)
  const output = await PDFDocument.create()
  const brandSignatureAssets = options.includeBrandSignature ? await getBrandSignatureAssets(output) : null
  let currentSheet = output.addPage([A4_PORTRAIT.width, A4_PORTRAIT.height])
  let itemIndex = 0

  for (const { file, pageIndices, source } of preparedSources) {
    if (pageIndices.length === 0) {
      continue
    }

    const copiedPages = await output.copyPages(source, pageIndices)

    for (const copiedPage of copiedPages) {
      const rotation = normalizePdfRotation((file.id ? rotationsByFileId[file.id] : undefined) ?? defaultRotation)
      let croppedSize: { width: number; height: number }

      if (profile.mode === "manual") {
        const fileCrop = (file.id ? manualCropsByFileId[file.id] : undefined) ?? fallbackManualCrop
        croppedSize = cropPageToManualRect(copiedPage, fileCrop)
      } else if ("cropRect" in profile && profile.cropRect) {
        croppedSize = cropPageToManualRect(copiedPage, profile.cropRect)
      } else if ("crop" in profile && profile.crop) {
        croppedSize = cropPageToRule(copiedPage, profile.crop)
      } else {
        throw new Error(PDF_TOOL_ERROR_MESSAGES.incompleteProfile)
      }

      const embeddedPage = await output.embedPage(copiedPage)
      const slotIndex =
        shouldUseSingleLabelSlot && options.singleLabelSlot
          ? SINGLE_LABEL_SLOT_MAP[options.singleLabelSlot]
          : SLOT_ORDER[itemIndex % 4]
      const slot = getSlotRect(slotIndex)
      const labelSlotHeight = options.includeBrandSignature
        ? slot.height - BRAND_SIGNATURE_RESERVED_HEIGHT
        : slot.height
      const rotatedSize = getRotatedSize(croppedSize, rotation)
      const scale = Math.min(slot.width / rotatedSize.width, labelSlotHeight / rotatedSize.height)
      const drawWidth = rotatedSize.width * scale
      const drawHeight = rotatedSize.height * scale
      const x = slot.x + (slot.width - drawWidth) / 2
      const y =
        slot.y +
        (options.includeBrandSignature ? BRAND_SIGNATURE_RESERVED_HEIGHT : 0) +
        (labelSlotHeight - drawHeight) / 2
      const drawOffset = getRotationDrawOffset(rotation, croppedSize, scale)

      currentSheet.drawPage(embeddedPage, {
        x: x + drawOffset.x,
        y: y + drawOffset.y,
        xScale: scale,
        yScale: scale,
        rotate: degrees(-rotation),
      })
      if (brandSignatureAssets) {
        drawBrandSignature({
          assets: brandSignatureAssets,
          page: currentSheet,
          slot,
        })
      }

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
  options: {
    chronopostVariantId?: ChronopostVariantId
    mondialRelayVariantId?: MondialRelayVariantId
  } = {},
) {
  const profile = getResolvedLabelProfile(profileId, {
    chronopostVariantId: options.chronopostVariantId,
    mondialRelayVariantId: options.mondialRelayVariantId,
  })
  return `${sanitizePdfName(files[0].name)}_${profile.slug}_a4_x4.pdf`
}
