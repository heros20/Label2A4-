import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { isSupabaseAdminConfigured } from "@/lib/supabase/config"

export const runtime = "nodejs"

interface CleanupOperationResult {
  count: number
  name: string
  ok: boolean
  warning?: string
}

function readPositiveIntegerEnv(name: string, fallback: number) {
  const parsed = Number(process.env[name])
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function dayKeyDaysAgo(days: number) {
  return daysAgoIso(days).slice(0, 10)
}

async function runCleanupOperation(
  name: string,
  operation: () => Promise<{ count: number | null; error: { message: string } | null }>,
): Promise<CleanupOperationResult> {
  try {
    const result = await operation()

    if (result.error) {
      return {
        count: 0,
        name,
        ok: false,
        warning: result.error.message,
      }
    }

    return {
      count: result.count ?? 0,
      name,
      ok: true,
    }
  } catch (error) {
    return {
      count: 0,
      name,
      ok: false,
      warning: error instanceof Error ? error.message : "Erreur inconnue.",
    }
  }
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim()

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET manquant." }, { status: 503 })
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Acces cron refuse." }, { status: 401 })
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Supabase service role non configure." }, { status: 503 })
  }

  const supabase = getSupabaseAdminClient()
  const nowIso = new Date().toISOString()
  const rateLimitRetentionDays = readPositiveIntegerEnv("RATE_LIMIT_RETENTION_DAYS", 2)
  const quotaRetentionDays = readPositiveIntegerEnv("QUOTA_USAGE_RETENTION_DAYS", 90)
  const redemptionRetentionDays = readPositiveIntegerEnv("PROMO_REDEMPTION_RETENTION_DAYS", 90)

  const operations = await Promise.all([
    runCleanupOperation("promo_pending_expired", async () =>
      await supabase
        .from("promo_code_redemptions")
        .update({ status: "expired", updated_at: nowIso }, { count: "exact" })
        .eq("status", "pending")
        .lte("expires_at", nowIso),
    ),
    runCleanupOperation("promo_expired_or_void_deleted", async () =>
      await supabase
        .from("promo_code_redemptions")
        .delete({ count: "exact" })
        .in("status", ["expired", "void"])
        .lt("updated_at", daysAgoIso(redemptionRetentionDays)),
    ),
    runCleanupOperation("rate_limit_deleted", async () =>
      await supabase
        .from("rate_limit_usage")
        .delete({ count: "exact" })
        .lt("updated_at", daysAgoIso(rateLimitRetentionDays)),
    ),
    runCleanupOperation("daily_quota_deleted", async () =>
      await supabase
        .from("daily_quota_usage")
        .delete({ count: "exact" })
        .lt("day_key", dayKeyDaysAgo(quotaRetentionDays)),
    ),
  ])

  const hasWarning = operations.some((operation) => !operation.ok)

  if (hasWarning) {
    console.warn("[label2a4-cron-cleanup-warning]", operations)
  } else {
    console.info("[label2a4-cron-cleanup]", operations)
  }

  return NextResponse.json(
    {
      ok: !hasWarning,
      operations,
      retention: {
        quotaRetentionDays,
        rateLimitRetentionDays,
        redemptionRetentionDays,
      },
    },
    { status: hasWarning ? 207 : 200 },
  )
}
