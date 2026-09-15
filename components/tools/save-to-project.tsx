"use client"

import * as React from "react"
import Link from "next/link"
import { RiCheckLine, RiFolderAddLine, RiLoader4Line } from "@remixicon/react"

import { Field } from "@/components/app/field"
import { FormSelect } from "@/components/app/filter-select"
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
import {
  newId,
  useCurrentMember,
  useProjects,
  useStoreMode,
  useWorkspace,
  useWorkspaceId,
} from "@/lib/store/workspace"
import { createClient } from "@/lib/supabase/client"
import {
  assetObjectPath,
  assetTypeFor,
  extensionOf,
  probeMedia,
  uploadToBucket,
} from "@/lib/supabase/storage"

/**
 * Saves a tool result into a project as a regular asset, reusing the same
 * upload pipeline as the asset library. Hidden in demo mode.
 */
export function SaveToProjectButton({
  blob,
  filename,
  disabled,
}: {
  blob: Blob
  filename: string
  disabled?: boolean
}) {
  const mode = useStoreMode()
  const projects = useProjects()
  const { actions } = useWorkspace()
  const workspaceId = useWorkspaceId()
  const member = useCurrentMember()
  const [open, setOpen] = React.useState(false)
  const [projectId, setProjectId] = React.useState(projects[0]?.id ?? "")
  const [name, setName] = React.useState(filename)
  const [state, setState] = React.useState<"idle" | "saving" | "done" | "error">("idle")
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setName(filename)
      setState("idle")
      setError(null)
      if (!projectId && projects[0]) setProjectId(projects[0].id)
    }
  }, [open, filename, projects, projectId])

  if (mode !== "live") return null

  async function save() {
    if (!projectId) return
    setState("saving")
    setError(null)
    try {
      const file = new File([blob], name, { type: blob.type })
      const type = assetTypeFor(file)
      const ext = extensionOf(name)
      const probe = await probeMedia(file, type)
      const id = newId()
      const path = assetObjectPath(workspaceId, projectId, id, ext)
      const supabase = createClient()
      const uploaded = await uploadToBucket(supabase, path, file, file.type || undefined)
      actions.addAsset({
        projectId,
        name,
        type,
        extension: ext,
        previewUrl: type === "image" ? uploaded.publicUrl : undefined,
        storagePath: uploaded.storagePath,
        width: probe.width,
        height: probe.height,
        duration: probe.duration,
        size: file.size,
        uploadedById: member.id,
        tags: ["tools"],
      })
      setState("done")
    } catch (err) {
      setState("error")
      setError(err instanceof Error ? err.message : "Could not save")
    }
  }

  return (
    <>
      <Button variant="outline" disabled={disabled || projects.length === 0} onClick={() => setOpen(true)}>
        <RiFolderAddLine data-icon="inline-start" />
        Save to project
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-title">Save to project</DialogTitle>
            <DialogDescription>The result is uploaded as a new asset.</DialogDescription>
          </DialogHeader>
          {state === "done" ? (
            <div className="flex items-center gap-3 rounded-lg bg-success/10 px-3 py-3 text-sm text-success">
              <RiCheckLine className="size-4" />
              <span className="flex-1">Saved to the project&apos;s assets.</span>
              <Link
                href={`/projects/${projectId}/assets`}
                className="font-medium underline underline-offset-4"
                onClick={() => setOpen(false)}
              >
                Open
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              <Field label="Project" htmlFor="save-project">
                <FormSelect
                  id="save-project"
                  value={projectId}
                  onValueChange={setProjectId}
                  options={projects.map((p) => ({ value: p.id, label: p.name }))}
                  placeholder="Choose a project"
                />
              </Field>
              <Field label="File name" htmlFor="save-name">
                <Input id="save-name" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {state === "done" ? "Close" : "Cancel"}
            </Button>
            {state !== "done" && (
              <Button onClick={save} disabled={state === "saving" || !projectId || !name.trim()}>
                {state === "saving" && <RiLoader4Line className="animate-spin" data-icon="inline-start" />}
                Save
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
