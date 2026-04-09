import { PDFDocument } from "pdf-lib"
import { getLabelProfile, type LabelCropRule, type LabelProfileId } from "@/lib/label-profiles"

const A4_PORTRAIT = { width: 595.28, height: 841.89 }
const PAGE_MARGIN = 18
const GRID_GAP = 12
const ROWS = 2
const COLUMNS = 2

// The user wants labels to fill the A4 in this exact order.
const SLOT_ORDER = [1, 0, 3, 2] as const

function sanitizePdfName(name: string) {
  return name.toLowerCase().endsWith(".pdf") ? name.slice(0, -4) : name
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function normalizeCropRule(cropRule: LabelCropRule): Required<LabelCropRule> {
  return {
    side: cropRule.side,
    portion: clamp(cropRule.portion, 0.01, 1),
    verticalSide: cropRule.verticalSide ?? "bottom",
    verticalPortion: clamp(cropRule.verticalPortion ?? 1, 0.01, 1),
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
  const left = 0
  const bottom = 0
  const right = page.getWidth()
  const top = page.getHeight()
  const width = right - left
  const height = top - bottom

  const keptWidth = width * rule.portion
  const keptHeight = height * rule.verticalPortion
  const x0 = rule.side === "right" ? left + width * (1 - rule.portion) : left
  const x1 = rule.side === "right" ? right : left + keptWidth
  const y0 = rule.verticalSide === "top" ? top - keptHeight : bottom
  const y1 = rule.verticalSide === "top" ? top : bottom + keptHeight
  const croppedWidth = x1 - x0
  const croppedHeight = y1 - y0

  if (croppedWidth <= 0 || croppedHeight <= 0) {
    throw new Error("Le rognage produit une page vide.")
  }

  page.translateContent(-x0, -y0)
  page.resetPosition?.()
  page.setMediaBox(0, 0, croppedWidth, croppedHeight)
  page.setCropBox?.(0, 0, croppedWidth, croppedHeight)
  page.setTrimBox?.(0, 0, croppedWidth, croppedHeight)
  page.setBleedBox?.(0, 0, croppedWidth, croppedHeight)
  page.setArtBox?.(0, 0, croppedWidth, croppedHeight)

  return { width: croppedWidth, height: croppedHeight }
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

export async function getPdfPageCount(file: File) {
  const bytes = await file.arrayBuffer()
  const document = await PDFDocument.load(bytes)
  return document.getPageCount()
}

export async function buildLabelA4Pdf(files: File[], profileId: LabelProfileId) {
  if (files.length === 0) {
    throw new Error("Ajoutez au moins un PDF.")
  }

  const profile = getLabelProfile(profileId)
  const output = await PDFDocument.create()
  let currentSheet = output.addPage([A4_PORTRAIT.width, A4_PORTRAIT.height])
  let itemIndex = 0

  for (const file of files) {
    const source = await PDFDocument.load(await file.arrayBuffer())
    const copiedPages = await output.copyPages(source, source.getPageIndices())

    for (const copiedPage of copiedPages) {
      const croppedSize = cropPageToRule(copiedPage, profile.crop)
      const embeddedPage = await output.embedPage(copiedPage)
      const slot = getSlotRect(SLOT_ORDER[itemIndex % 4])
      const scale = Math.min(slot.width / croppedSize.width, slot.height / croppedSize.height)
      const drawWidth = croppedSize.width * scale
      const drawHeight = croppedSize.height * scale
      const x = slot.x + (slot.width - drawWidth) / 2
      const y = slot.y + (slot.height - drawHeight) / 2

      currentSheet.drawPage(embeddedPage, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
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

export function buildLabelPdfName(files: File[], profileId: LabelProfileId) {
  const profile = getLabelProfile(profileId)
  return `${sanitizePdfName(files[0].name)}_${profile.slug}_a4_x4.pdf`
}
