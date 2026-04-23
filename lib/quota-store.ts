import "server-only"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { isSupabaseAdminConfigured } from "@/lib/supabase/config"

interface ConsumeStoredDailyQuotaInput {
  dailyLimit: number
  dayKey: string
  fingerprintHash: string
  sheetCount: number
}

interface ConsumeStoredQuotaWithGuardInput {
  dayKey: string
  guardHash?: string | null
  guardLimit?: number | null
  primaryHash: string
  primaryLimit: number
  sheetCount: number
}

interface ConsumeStoredQuotaWithGuardOnceInput extends ConsumeStoredQuotaWithGuardInput {
  action: "download" | "print"
  exportId: string
  fileName?: string
}

interface ConsumeStoredDailyQuotaRow {
  allowed: boolean
  next_used_sheets: number
  used_sheets: number
}

interface ConsumeStoredQuotaWithGuardRow extends ConsumeStoredDailyQuotaRow {
  guard_next_used_sheets: number
  guard_used_sheets: number
  reason: string | null
}

interface ConsumeStoredQuotaWithGuardOnceRow extends ConsumeStoredQuotaWithGuardRow {
  already_exported: boolean
  consumed_sheets: number
}

export function isQuotaDatabaseConfigured() {
  return isSupabaseAdminConfigured()
}

export async function getStoredDailyQuota(input: { dayKey: string; fingerprintHash: string }) {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("daily_quota_usage")
    .select("used_sheets")
    .eq("fingerprint_hash", input.fingerprintHash)
    .eq("day_key", input.dayKey)
    .maybeSingle()

  if (error) {
    throw new Error(`Unable to load stored quota: ${error.message}`)
  }

  return {
    dayKey: input.dayKey,
    usedSheets: data?.used_sheets ?? 0,
  }
}

export async function consumeStoredDailyQuota(input: ConsumeStoredDailyQuotaInput) {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.rpc("consume_daily_quota", {
    p_daily_limit: input.dailyLimit,
    p_day_key: input.dayKey,
    p_fingerprint_hash: input.fingerprintHash,
    p_sheet_count: input.sheetCount,
  })

  if (error) {
    throw new Error(`Unable to update stored quota: ${error.message}`)
  }

  const row = (Array.isArray(data) ? data[0] : data) as ConsumeStoredDailyQuotaRow | null

  if (
    !row ||
    typeof row.allowed !== "boolean" ||
    typeof row.used_sheets !== "number" ||
    typeof row.next_used_sheets !== "number"
  ) {
    throw new Error("Unexpected response from consume_daily_quota RPC.")
  }

  return {
    allowed: row.allowed,
    nextUsedSheets: row.next_used_sheets,
    usedSheets: row.used_sheets,
  }
}

export async function consumeStoredQuotaWithGuard(input: ConsumeStoredQuotaWithGuardInput) {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.rpc("consume_daily_quota_guarded", {
    p_day_key: input.dayKey,
    p_guard_hash: input.guardHash ?? null,
    p_guard_limit: input.guardLimit ?? null,
    p_primary_hash: input.primaryHash,
    p_primary_limit: input.primaryLimit,
    p_sheet_count: input.sheetCount,
  })

  if (error) {
    throw new Error(`Unable to update guarded stored quota: ${error.message}`)
  }

  const row = (Array.isArray(data) ? data[0] : data) as ConsumeStoredQuotaWithGuardRow | null

  if (
    !row ||
    typeof row.allowed !== "boolean" ||
    typeof row.used_sheets !== "number" ||
    typeof row.next_used_sheets !== "number" ||
    typeof row.guard_used_sheets !== "number" ||
    typeof row.guard_next_used_sheets !== "number"
  ) {
    throw new Error("Unexpected response from consume_daily_quota_guarded RPC.")
  }

  return {
    allowed: row.allowed,
    guardNextUsedSheets: row.guard_next_used_sheets,
    guardUsedSheets: row.guard_used_sheets,
    nextUsedSheets: row.next_used_sheets,
    reason: row.reason ?? null,
    usedSheets: row.used_sheets,
  }
}

export async function consumeStoredQuotaWithGuardOnce(input: ConsumeStoredQuotaWithGuardOnceInput) {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.rpc("consume_daily_quota_guarded_once", {
    p_action: input.action,
    p_day_key: input.dayKey,
    p_export_id: input.exportId,
    p_file_name: input.fileName ?? null,
    p_guard_hash: input.guardHash ?? null,
    p_guard_limit: input.guardLimit ?? null,
    p_primary_hash: input.primaryHash,
    p_primary_limit: input.primaryLimit,
    p_sheet_count: input.sheetCount,
  })

  if (error) {
    throw new Error(`Unable to update idempotent stored quota: ${error.message}`)
  }

  const row = (Array.isArray(data) ? data[0] : data) as ConsumeStoredQuotaWithGuardOnceRow | null

  if (
    !row ||
    typeof row.allowed !== "boolean" ||
    typeof row.used_sheets !== "number" ||
    typeof row.next_used_sheets !== "number" ||
    typeof row.guard_used_sheets !== "number" ||
    typeof row.guard_next_used_sheets !== "number" ||
    typeof row.already_exported !== "boolean" ||
    typeof row.consumed_sheets !== "number"
  ) {
    throw new Error("Unexpected response from consume_daily_quota_guarded_once RPC.")
  }

  return {
    allowed: row.allowed,
    alreadyExported: row.already_exported,
    consumedSheets: row.consumed_sheets,
    guardNextUsedSheets: row.guard_next_used_sheets,
    guardUsedSheets: row.guard_used_sheets,
    nextUsedSheets: row.next_used_sheets,
    reason: row.reason ?? null,
    usedSheets: row.used_sheets,
  }
}
