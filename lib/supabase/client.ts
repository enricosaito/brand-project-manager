import { createBrowserClient } from "@supabase/ssr"

import { supabaseEnv } from "./env"

/** Supabase client for Client Components. Safe to call on every render. */
export function createClient() {
  const { url, key } = supabaseEnv()
  return createBrowserClient(url, key)
}
