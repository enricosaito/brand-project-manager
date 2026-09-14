import type { User } from "@supabase/supabase-js"

/** The slice of the Supabase user the UI needs. */
export interface AuthUser {
  id: string
  email: string
  name: string
  initials: string
}

export function toAuthUser(user: User): AuthUser {
  const email = user.email ?? ""
  const metaName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined)
  const name = metaName?.trim() || email.split("@")[0] || "You"
  return { id: user.id, email, name, initials: initialsOf(name) }
}

export function initialsOf(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
