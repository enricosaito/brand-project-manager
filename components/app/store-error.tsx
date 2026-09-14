"use client"

import * as React from "react"
import { RiCloseLine, RiErrorWarningLine } from "@remixicon/react"

import { useWorkspace } from "@/lib/store/workspace"

/** Surfaces failed writes from the workspace store as a quiet, dismissible notice. */
export function StoreErrorBanner() {
  const { error, clearError } = useWorkspace()

  React.useEffect(() => {
    if (!error) return
    const t = window.setTimeout(clearError, 7000)
    return () => window.clearTimeout(t)
  }, [error, clearError])

  if (!error) return null

  return (
    <div
      role="alert"
      className="fixed bottom-5 left-1/2 z-50 flex max-w-md -translate-x-1/2 items-start gap-2.5 rounded-lg bg-foreground px-3.5 py-3 text-sm text-background shadow-xl animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
    >
      <RiErrorWarningLine className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="min-w-0">
        <div className="font-medium">Couldn&apos;t save that change</div>
        <div className="mt-0.5 text-xs text-background/70">{error}</div>
      </div>
      <button
        type="button"
        onClick={clearError}
        aria-label="Dismiss"
        className="-mr-1 ml-1 flex size-6 shrink-0 items-center justify-center rounded-md text-background/70 transition-colors hover:bg-background/10 hover:text-background"
      >
        <RiCloseLine className="size-4" />
      </button>
    </div>
  )
}
