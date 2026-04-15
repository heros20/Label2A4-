import "server-only"
import type { User } from "@supabase/supabase-js"
import { type NextRequest, type NextResponse } from "next/server"
import { isSupabaseAuthConfigured } from "@/lib/supabase/config"
import { createRouteSupabaseClient } from "@/lib/supabase/route"

export async function getAuthenticatedUser(
  request: NextRequest,
  response: NextResponse,
): Promise<User | null> {
  if (!isSupabaseAuthConfigured()) {
    return null
  }

  const supabase = createRouteSupabaseClient(request, response)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}
