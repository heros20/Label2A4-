import "server-only"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseServiceRoleKey, getSupabaseUrl, isSupabaseAdminConfigured } from "@/lib/supabase/config"

let cachedSupabaseAdminClient: SupabaseClient | null = null

export function getSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase admin client is not configured.")
  }

  if (!cachedSupabaseAdminClient) {
    cachedSupabaseAdminClient = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    })
  }

  return cachedSupabaseAdminClient
}
