import "server-only"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { isSupabaseAdminConfigured } from "@/lib/supabase/config"

interface ConsumeStoredDailyQuotaInput {
  dailyLimit: number
  dayKey: string
  fingerprintHash: string
  sheetCount: number
}

interface ConsumeStoredDailyQuotaRow {
  allowed: boolean
  next_used_sheets: number
  used_sheets: number
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
