import "server-only"
import { createHash } from "crypto"
import { NextRequest } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { isSupabaseAdminConfigured } from "@/lib/supabase/config"

interface RateLimitInput {
  bucket: string
  limit: number
  windowSeconds: number
}

interface RateLimitRow {
  allowed: boolean
  hits: number
}

function getClientIp(request: NextRequest) {
  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim()
  const realIp = request.headers.get("x-real-ip")?.trim()
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()

  return vercelForwardedFor || cloudflareIp || realIp || forwardedFor || "local"
}

function getUserAgentFamily(request: NextRequest) {
  const userAgent = request.headers.get("user-agent")?.toLowerCase() ?? "unknown"

  if (userAgent.includes("edg/")) {
    return "edge"
  }

  if (userAgent.includes("chrome/") || userAgent.includes("crios/")) {
    return "chrome"
  }

  if (userAgent.includes("firefox/") || userAgent.includes("fxios/")) {
    return "firefox"
  }

  if (userAgent.includes("safari/")) {
    return "safari"
  }

  return "other"
}

function hashBucket(input: string) {
  return createHash("sha256").update(input).digest("hex")
}

export async function consumeRateLimit(request: NextRequest, input: RateLimitInput) {
  if (!isSupabaseAdminConfigured()) {
    return {
      allowed: true,
      hits: 0,
    }
  }

  const now = Date.now()
  const windowKey = `${Math.floor(now / (input.windowSeconds * 1000))}`
  const bucketHash = hashBucket(`${input.bucket}:${getClientIp(request)}:${getUserAgentFamily(request)}`)
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_bucket_hash: bucketHash,
    p_limit: input.limit,
    p_window_key: `${input.bucket}:${windowKey}`,
  })

  if (error) {
    if (
      error.code === "PGRST202" ||
      error.message.includes("Could not find the function public.consume_rate_limit")
    ) {
      return {
        allowed: true,
        hits: 0,
      }
    }

    throw new Error(`Unable to consume rate limit: ${error.message}`)
  }

  const row = (Array.isArray(data) ? data[0] : data) as RateLimitRow | null

  return {
    allowed: row?.allowed ?? true,
    hits: row?.hits ?? 0,
  }
}
