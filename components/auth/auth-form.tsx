"use client"

import * as React from "react"
import { RiCheckLine, RiErrorWarningLine, RiLoader4Line } from "@remixicon/react"

import { signIn, signUp, type AuthState } from "@/app/(auth)/login/actions"
import { Field } from "@/components/app/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Mode = "signin" | "signup"

interface AuthFormProps {
  initialMode?: Mode
  next?: string
  linkError?: boolean
}

const EMPTY: AuthState = {}

export function AuthForm({ initialMode = "signin", next, linkError }: AuthFormProps) {
  const [mode, setMode] = React.useState<Mode>(initialMode)
  const [signInState, signInAction, signInPending] = React.useActionState(signIn, EMPTY)
  const [signUpState, signUpAction, signUpPending] = React.useActionState(signUp, EMPTY)

  const isSignIn = mode === "signin"
  const state = isSignIn ? signInState : signUpState
  const pending = isSignIn ? signInPending : signUpPending

  return (
    <div key={mode} className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300 ease-out-quart">
      <h1 className="text-display">{isSignIn ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        {isSignIn
          ? "Sign in to your workspace."
          : "Start managing brand projects with your team."}
      </p>

      <form action={isSignIn ? signInAction : signUpAction} className="mt-8 space-y-5">
        {next && <input type="hidden" name="next" value={next} />}

        {!isSignIn && (
          <Field label="Full name" htmlFor="auth-name">
            <Input
              id="auth-name"
              name="name"
              autoComplete="name"
              placeholder="André Lona"
              defaultValue={state.name}
              required
            />
          </Field>
        )}

        <Field label="Email" htmlFor="auth-email">
          <Input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@studio.com"
            defaultValue={state.email}
            required
            autoFocus
          />
        </Field>

        <Field label="Password" htmlFor="auth-password">
          <Input
            id="auth-password"
            name="password"
            type="password"
            autoComplete={isSignIn ? "current-password" : "new-password"}
            placeholder={isSignIn ? "Your password" : "At least 8 characters"}
            minLength={isSignIn ? undefined : 8}
            required
          />
        </Field>

        {(state.error || (linkError && !state.success)) && (
          <Notice tone="error">
            {state.error ?? "That link is invalid or has expired. Sign in or request a new one."}
          </Notice>
        )}
        {state.success && <Notice tone="success">{state.success}</Notice>}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <RiLoader4Line className="animate-spin" data-icon="inline-start" />
          ) : null}
          {isSignIn ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        {isSignIn ? "New to Marcados?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => setMode(isSignIn ? "signup" : "signin")}
          className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/30 rounded-sm"
        >
          {isSignIn ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  )
}

function Notice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const Icon = tone === "error" ? RiErrorWarningLine : RiCheckLine
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm animate-in fade-in-0 duration-200",
        tone === "error"
          ? "bg-destructive/8 text-destructive"
          : "bg-success/10 text-success"
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span className="text-pretty">{children}</span>
    </div>
  )
}
