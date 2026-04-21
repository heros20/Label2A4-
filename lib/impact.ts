import type { ImpactCounter } from "@/lib/monetization-types"

export const LABELS_PER_A4_SHEET = 4
export const A4_SHEETS_PER_TREE_ESTIMATE = 8000

export interface LabelImpactInput {
  labelCount: number
  optimizedSheetCount?: number
}

export function normalizePositiveInteger(value: number | null | undefined, fallback = 0) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.max(Math.floor(parsed), 0)
}

export function calculateOptimizedSheetCount(labelCount: number) {
  const normalizedLabelCount = normalizePositiveInteger(labelCount)
  return normalizedLabelCount > 0 ? Math.ceil(normalizedLabelCount / LABELS_PER_A4_SHEET) : 0
}

export function calculateLabelImpact(input: LabelImpactInput): ImpactCounter {
  const labelsOptimized = normalizePositiveInteger(input.labelCount)
  const optimizedSheets = Math.max(
    normalizePositiveInteger(input.optimizedSheetCount, calculateOptimizedSheetCount(labelsOptimized)),
    calculateOptimizedSheetCount(labelsOptimized),
  )

  // Baseline volontairement simple et vérifiable : une étiquette transporteur imprimée seule consomme une feuille A4.
  const sheetsSaved = Math.max(labelsOptimized - optimizedSheets, 0)

  return {
    estimatedTreesSaved: sheetsSaved / A4_SHEETS_PER_TREE_ESTIMATE,
    labelsOptimized,
    optimizedSheets,
    sheetsSaved,
  }
}

export function emptyImpactCounter(): ImpactCounter {
  return {
    estimatedTreesSaved: 0,
    labelsOptimized: 0,
    optimizedSheets: 0,
    sheetsSaved: 0,
  }
}

export function buildImpactCounter(input: {
  labelsOptimized?: number | null
  optimizedSheets?: number | null
  sheetsSaved?: number | null
}): ImpactCounter {
  const sheetsSaved = normalizePositiveInteger(input.sheetsSaved ?? 0)

  return {
    estimatedTreesSaved: sheetsSaved / A4_SHEETS_PER_TREE_ESTIMATE,
    labelsOptimized: normalizePositiveInteger(input.labelsOptimized ?? 0),
    optimizedSheets: normalizePositiveInteger(input.optimizedSheets ?? 0),
    sheetsSaved,
  }
}
