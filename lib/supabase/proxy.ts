import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { supabaseEnv } from "./env"

/** Routes reachable without a session. */
const PUBLIC_PATHS = ["/login", "/auth"]

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/**
 * Refreshes the Supabase session cookie on every request and enforces the
 * authentication boundary: signed-out visitors go to /login, signed-in
 * visitors are kept out of /login.
 */
export async function updateSession(request: NextRequest) {
  const { url, key } = supabaseEnv()
  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // Do not put logic between createServerClient and getUser(): the call is
  // what refreshes an expired session.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname, search } = request.nextUrl

  if (!user && !isPublic(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.search = ""
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", `${pathname}${search}`)
    }
    return NextResponse.redirect(loginUrl)
  }

  if (user && pathname === "/login") {
    const appUrl = request.nextUrl.clone()
    appUrl.pathname = "/projects"
    appUrl.search = ""
    return NextResponse.redirect(appUrl)
  }

  return response
}
