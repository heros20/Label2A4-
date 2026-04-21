import "server-only"
import { createHash } from "crypto"
import { calculateLabelImpact, buildImpactCounter, emptyImpactCounter } from "@/lib/impact"
import type { ImpactCounter, ImpactSnapshot } from "@/lib/monetization-types"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { isSupabaseAdminConfigured } from "@/lib/supabase/config"

type ImpactScopeType = "account" | "guest" | "platform"

interface ImpactCounterRow {
  labels_optimized: number
  optimized_sheets: number
  sheets_saved: number
}

const PLATFORM_SCOPE_HASH = "global"

function hashScope(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 40)
}

function resolveIndividualScope(input: { anonymousId: string; userId?: string | null }) {
  if (input.userId) {
    return {
      scopeHash: hashScope(input.userId),
      scopeType: "account" as const,
    }
  }

  return {
    scopeHash: hashScope(input.anonymousId),
    scopeType: "guest" as const,
  }
}

function toImpactCounter(row?: ImpactCounterRow | null): ImpactCounter {
  if (!row) {
    return emptyImpactCounter()
  }

  return buildImpactCounter({
    labelsOptimized: row.labels_optimized,
    optimizedSheets: row.optimized_sheets,
    sheetsSaved: row.sheets_saved,
  })
}

function isMissingImpactStorageError(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST205" ||
    Boolean(error?.message?.includes("Could not find the table 'public.label_impact_counters'"))
  )
}

export function isImpactStoreConfigured() {
  return isSupabaseAdminConfigured()
}

export async function getImpactSnapshot(input: {
  anonymousId: string
  userId?: string | null
}): Promise<ImpactSnapshot> {
  if (!isImpactStoreConfigured()) {
    return {
      individual: emptyImpactCounter(),
      platform: emptyImpactCounter(),
    }
  }

  const supabase = getSupabaseAdminClient()
  const individualScope = resolveIndividualScope(input)
  const [individualResult, platformResult] = await Promise.all([
    supabase
      .from("label_impact_counters")
      .select("labels_optimized, optimized_sheets, sheets_saved")
      .eq("scope_type", individualScope.scopeType)
      .eq("scope_hash", individualScope.scopeHash)
      .maybeSingle<ImpactCounterRow>(),
    supabase
      .from("label_impact_counters")
      .select("labels_optimized, optimized_sheets, sheets_saved")
      .eq("scope_type", "platform")
      .eq("scope_hash", PLATFORM_SCOPE_HASH)
      .maybeSingle<ImpactCounterRow>(),
  ])

  if (isMissingImpactStorageError(individualResult.error) || isMissingImpactStorageError(platformResult.error)) {
    return {
      individual: emptyImpactCounter(),
      platform: emptyImpactCounter(),
    }
  }

  if (individualResult.error) {
    throw new Error(`Unable to load individual impact counter: ${individualResult.error.message}`)
  }

  if (platformResult.error) {
    throw new Error(`Unable to load platform impact counter: ${platformResult.error.message}`)
  }

  return {
    individual: toImpactCounter(individualResult.data),
    platform: toImpactCounter(platformResult.data),
  }
}

export async function recordExportImpact(input: {
  anonymousId: string
  labelCount: number
  optimizedSheetCount: number
  userId?: string | null
}) {
  const impact = calculateLabelImpact({
    labelCount: input.labelCount,
    optimizedSheetCount: input.optimizedSheetCount,
  })

  if (!isImpactStoreConfigured() || impact.labelsOptimized <= 0) {
    return {
      impact,
      snapshot: await getImpactSnapshot({
        anonymousId: input.anonymousId,
        userId: input.userId,
      }),
    }
  }

  const individualScope = resolveIndividualScope(input)
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.rpc("record_label_impact", {
    p_labels_optimized: impact.labelsOptimized,
    p_optimized_sheets: impact.optimizedSheets,
    p_scope_hash: individualScope.scopeHash,
    p_scope_type: individualScope.scopeType as ImpactScopeType,
    p_sheets_saved: impact.sheetsSaved,
  })

  if (error) {
    throw new Error(`Unable to record label impact: ${error.message}`)
  }

  return {
    impact,
    snapshot: await getImpactSnapshot({
      anonymousId: input.anonymousId,
      userId: input.userId,
    }),
  }
}
