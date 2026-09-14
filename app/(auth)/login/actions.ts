"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"

import { createClient } from "@/lib/supabase/server"

export interface AuthState {
  error?: string
  success?: string
  /** Echoed back so the form can keep what the user typed. */
  email?: string
  name?: string
}

function field(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim() : ""
}

function safeNext(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/projects"
  return value
}

export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = field(formData, "email")
  const password = field(formData, "password")
  const next = safeNext(field(formData, "next") || "/projects")

  if (!email || !password) {
    return { email, error: "Enter your email and password." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { email, error: friendlyError(error.message) }
  }

  redirect(next)
}

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name = field(formData, "name")
  const email = field(formData, "email")
  const password = field(formData, "password")

  if (!name || !email || !password) {
    return { name, email, error: "Fill in your name, email and a password." }
  }
  if (password.length < 8) {
    return { name, email, error: "Use at least 8 characters for your password." }
  }

  const origin = (await headers()).get("origin") ?? ""
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { name, email, error: friendlyError(error.message) }
  }

  // Email confirmation enabled: no session yet.
  if (!data.session) {
    return {
      success: `We sent a confirmation link to ${email}. Open it to finish creating your account.`,
    }
  }

  redirect("/projects")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

function friendlyError(message: string) {
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials")) {
    return "That email and password don't match."
  }
  if (m.includes("email not confirmed")) {
    return "Confirm your email first. Check your inbox for the link."
  }
  if (m.includes("already registered")) {
    return "An account with this email already exists. Sign in instead."
  }
  return message
}
