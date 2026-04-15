"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseAuthConfigured } from "@/lib/supabase/config"

let cachedBrowserClient: SupabaseClient | null = null

export function getSupabaseBrowserClient() {
  if (!isSupabaseAuthConfigured()) {
    throw new Error("Supabase browser client is not configured.")
  }

  if (!cachedBrowserClient) {
    cachedBrowserClient = createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey())
  }

  return cachedBrowserClient
}
