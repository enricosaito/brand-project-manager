import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { supabaseEnv } from "./env"

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Create a new instance per request; never share it across requests.
 */
export async function createClient() {
  // Read cookies before touching env so Next marks the route dynamic first.
  // Otherwise a build without env vars fails while trying to prerender.
  const cookieStore = await cookies()
  const { url, key } = supabaseEnv()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component: cookies are read-only there.
          // The proxy refreshes sessions, so this can be ignored safely.
        }
      },
    },
  })
}
