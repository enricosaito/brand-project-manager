"use client"

import * as React from "react"
import { RiCheckLine, RiLoader4Line } from "@remixicon/react"

import { createWorkspace } from "@/app/(app)/workspace-actions"
import { Field } from "@/components/app/field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const COLORS = ["#1F1BE4", "#F2460D", "#0F8A5F", "#B8860B", "#7C3AED", "#111111"]

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [state, action, pending] = React.useActionState(createWorkspace, {})
  const [color, setColor] = React.useState(COLORS[0])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form action={action} className="contents">
          <DialogHeader>
            <DialogTitle className="text-title">New workspace</DialogTitle>
            <DialogDescription>
              A workspace holds a brand&apos;s projects, assets and team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <Field label="Name" htmlFor="ws-name">
              <Input id="ws-name" name="name" autoFocus placeholder="Silva Gym" required />
            </Field>
            <Field label="Colour">
              <input type="hidden" name="color" value={color} />
              <div className="flex gap-2">
                {COLORS.map((c) => {
                  const selected = c === color
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-label={c}
                      aria-pressed={selected}
                      onClick={() => setColor(c)}
                      className={cn(
                        "flex size-7 items-center justify-center rounded-md text-white outline-none transition-[box-shadow,transform] focus-visible:ring-3 focus-visible:ring-ring/30",
                        selected && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                      )}
                      style={{ backgroundColor: c }}
                    >
                      {selected && <RiCheckLine className="size-3.5" />}
                    </button>
                  )
                })}
              </div>
            </Field>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <RiLoader4Line className="animate-spin" data-icon="inline-start" />}
              Create workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
