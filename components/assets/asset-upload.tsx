"use client"

import * as React from "react"
import { RiCheckLine, RiErrorWarningLine, RiUploadCloud2Line } from "@remixicon/react"

import { Field } from "@/components/app/field"
import { FormSelect } from "@/components/app/filter-select"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UPLOAD_SAMPLES } from "@/data"
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
  posterPathFor,
  probeMedia,
  uploadToBucket,
} from "@/lib/supabase/storage"
import { formatBytes } from "@/lib/format"
import type { AssetInput } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AssetUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Fixed project when uploading from inside a project. */
  projectId?: string
}

type Status = "queued" | "uploading" | "done" | "error"

interface PendingFile {
  id: string
  name: string
  size: number
  status: Status
  error?: string
}

const CONCURRENCY = 3

/**
 * Upload dialog.
 *
 * Live mode: files go to Supabase Storage (with a generated poster frame for
 * videos), then an asset row is created through the store.
 * Demo mode: nothing leaves the browser; sample imagery stands in for files.
 */
export function AssetUpload({ open, onOpenChange, projectId }: AssetUploadProps) {
  const projects = useProjects()
  const { actions } = useWorkspace()
  const mode = useStoreMode()
  const workspaceId = useWorkspaceId()
  const member = useCurrentMember()
  const [target, setTarget] = React.useState(projectId ?? projects[0]?.id ?? "")
  const [dragging, setDragging] = React.useState(false)
  const [queue, setQueue] = React.useState<PendingFile[]>([])
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) {
      setQueue([])
      setTarget(projectId ?? projects[0]?.id ?? "")
    }
  }, [open, projectId, projects])

  const uploading = queue.some((f) => f.status === "queued" || f.status === "uploading")
  const finished = queue.length > 0 && !uploading

  const patch = (id: string, changes: Partial<PendingFile>) =>
    setQueue((q) => q.map((f) => (f.id === id ? { ...f, ...changes } : f)))

  /* ---------------------------------------------------------------- live */
  async function uploadOne(entry: PendingFile, file: File) {
    patch(entry.id, { status: "uploading" })
    try {
      const supabase = createClient()
      const type = assetTypeFor(file)
      const ext = extensionOf(file.name)
      const probe = await probeMedia(file, type)
      const path = assetObjectPath(workspaceId, target, entry.id, ext)
      const uploaded = await uploadToBucket(supabase, path, file, file.type || undefined)

      let previewUrl: string | undefined
      if (type === "image") previewUrl = uploaded.publicUrl
      if (type === "video" && probe.poster) {
        const poster = await uploadToBucket(supabase, posterPathFor(path), probe.poster, "image/jpeg")
        previewUrl = poster.publicUrl
      }

      const input: AssetInput = {
        projectId: target,
        name: file.name,
        type,
        extension: ext,
        previewUrl,
        storagePath: uploaded.storagePath,
        width: probe.width,
        height: probe.height,
        duration: probe.duration,
        size: file.size,
        uploadedById: member.id,
        tags: [],
      }
      actions.addAsset(input)
      patch(entry.id, { status: "done" })
    } catch (err) {
      patch(entry.id, {
        status: "error",
        error: err instanceof Error ? err.message : "Upload failed",
      })
    }
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0 || !target) return
    const entries = files.map((file) => ({
      id: newId(),
      name: file.name,
      size: file.size,
      status: "queued" as Status,
    }))
    setQueue(entries)

    // Simple concurrency limiter.
    let next = 0
    const workers = Array.from({ length: Math.min(CONCURRENCY, files.length) }, async () => {
      while (next < files.length) {
        const i = next++
        await uploadOne(entries[i], files[i])
      }
    })
    await Promise.all(workers)
  }

  /* ---------------------------------------------------------------- demo */
  function mockUpload(count: number, names?: string[]) {
    const picked = [...UPLOAD_SAMPLES]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.max(1, Math.min(count, UPLOAD_SAMPLES.length)))
    const entries: PendingFile[] = picked.map((sample, i) => ({
      id: newId(),
      name: names?.[i] ?? sample.name,
      size: Math.round((2 + Math.random() * 7) * 1024 * 1024),
      status: "uploading",
    }))
    setQueue(entries)
    entries.forEach((entry, i) => {
      window.setTimeout(() => {
        const sample = picked[i]
        actions.addAsset({
          projectId: target,
          name: entry.name,
          type: "image",
          extension: extensionOf(entry.name) || "jpg",
          previewUrl: sample.url,
          width: sample.width,
          height: sample.height,
          size: entry.size,
          uploadedById: member.id,
          tags: [],
        })
        patch(entry.id, { status: "done" })
      }, 700 + i * 350)
    })
  }

  /* ------------------------------------------------------------- handlers */
  function handleFiles(files: File[]) {
    if (uploading || files.length === 0) return
    if (mode === "live") void uploadFiles(files)
    else mockUpload(files.length, files.map((f) => f.name))
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }

  function onBrowse(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(Array.from(e.target.files ?? []))
    e.target.value = ""
  }

  React.useEffect(() => {
    if (!finished) return
    if (queue.every((f) => f.status === "done")) {
      const t = window.setTimeout(() => onOpenChange(false), 800)
      return () => window.clearTimeout(t)
    }
  }, [finished, queue, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={(o) => !uploading && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!uploading}>
        <DialogHeader>
          <DialogTitle className="text-title">Upload assets</DialogTitle>
          <DialogDescription>
            {mode === "live"
              ? "Images, videos, documents and design files, up to 500 MB each."
              : "Demo mode simulates the upload with sample imagery."}
          </DialogDescription>
        </DialogHeader>

        {!projectId && (
          <Field label="Project" htmlFor="upload-project">
            <FormSelect
              id="upload-project"
              value={target}
              onValueChange={setTarget}
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
              placeholder="Choose a project"
            />
          </Field>
        )}

        {queue.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "flex min-h-52 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-[border-color,background-color] duration-200",
              dragging
                ? "border-foreground/50 bg-secondary"
                : "border-border bg-surface hover:border-foreground/30"
            )}
          >
            <div
              className={cn(
                "flex size-11 items-center justify-center rounded-lg bg-card text-muted-foreground ring-1 ring-foreground/10 transition-transform duration-200 ease-out-quart",
                dragging && "-translate-y-0.5 text-foreground"
              )}
            >
              <RiUploadCloud2Line className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">{dragging ? "Drop to upload" : "Drag files here"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                or{" "}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
                >
                  browse your computer
                </button>
              </p>
            </div>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={onBrowse} />
          </div>
        ) : (
          <ul className="flex flex-col gap-3 rounded-xl bg-surface p-4 ring-1 ring-foreground/5">
            {queue.map((file) => (
              <li key={file.id} className="flex items-center gap-3">
                <StatusIcon status={file.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm">{file.name}</span>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                  {file.status === "error" ? (
                    <p className="mt-1 text-xs text-destructive">{file.error}</p>
                  ) : (
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/10">
                      <div
                        className={cn(
                          "h-full rounded-full bg-foreground/70 transition-[width] duration-500 ease-out-quart",
                          file.status === "queued" && "w-0",
                          file.status === "uploading" && "w-2/3 animate-pulse",
                          file.status === "done" && "w-full"
                        )}
                      />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {queue.length === 0 && (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {mode === "demo" ? (
              <Button onClick={() => mockUpload(3)} disabled={!target}>
                Add sample files
              </Button>
            ) : (
              <Button onClick={() => inputRef.current?.click()} disabled={!target}>
                Choose files
              </Button>
            )}
          </div>
        )}

        {finished && queue.some((f) => f.status === "error") && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function StatusIcon({ status }: { status: Status }) {
  return (
    <div
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
        status === "done" && "bg-success text-white",
        status === "error" && "bg-destructive/10 text-destructive",
        (status === "queued" || status === "uploading") && "bg-secondary text-muted-foreground"
      )}
    >
      {status === "done" ? (
        <RiCheckLine className="size-3.5 animate-in zoom-in-50 duration-200" />
      ) : status === "error" ? (
        <RiErrorWarningLine className="size-3.5" />
      ) : (
        <span className={cn("size-1.5 rounded-full bg-current", status === "uploading" && "animate-pulse")} />
      )}
    </div>
  )
}
