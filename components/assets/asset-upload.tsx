"use client"

import * as React from "react"
import { RiCheckLine, RiUploadCloud2Line } from "@remixicon/react"

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
import { useCurrentMember, useProjects, useWorkspace } from "@/lib/store/workspace"
import type { AssetInput } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AssetUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Fixed project when uploading from inside a project. */
  projectId?: string
}

interface PendingFile {
  id: string
  name: string
  progress: number
  input: AssetInput
}

/**
 * Upload UI. No files leave the browser: dropping or "browsing" queues a few
 * sample images, animates their progress, then adds them to the workspace.
 * The shape of `AssetInput` is what a real upload endpoint would return.
 */
export function AssetUpload({ open, onOpenChange, projectId }: AssetUploadProps) {
  const projects = useProjects()
  const { actions } = useWorkspace()
  const member = useCurrentMember()
  const [target, setTarget] = React.useState(projectId ?? projects[0]?.id ?? "")
  const [dragging, setDragging] = React.useState(false)
  const [queue, setQueue] = React.useState<PendingFile[]>([])
  const [done, setDone] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) {
      setQueue([])
      setDone(false)
      setTarget(projectId ?? projects[0]?.id ?? "")
    }
  }, [open, projectId, projects])

  const uploading = queue.length > 0 && !done

  function startMockUpload(count: number, names?: string[]) {
    const picked = [...UPLOAD_SAMPLES]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.max(1, Math.min(count, UPLOAD_SAMPLES.length)))

    const pending: PendingFile[] = picked.map((sample, i) => ({
      id: `${Date.now()}_${i}`,
      name: names?.[i] ?? sample.name,
      progress: 0,
      input: {
        projectId: target,
        name: names?.[i] ?? sample.name,
        type: "image",
        extension: (names?.[i] ?? sample.name).split(".").pop()?.toLowerCase() ?? "jpg",
        previewUrl: sample.url,
        width: sample.width,
        height: sample.height,
        size: Math.round((2 + Math.random() * 7) * 1024 * 1024),
        uploadedById: member.id,
        tags: [],
      },
    }))
    setQueue(pending)

    // Animate progress, then commit.
    const started = performance.now()
    const duration = 1100 + pending.length * 250
    const tick = () => {
      const t = Math.min(1, (performance.now() - started) / duration)
      setQueue((q) =>
        q.map((f, i) => ({
          ...f,
          progress: Math.min(100, Math.round(100 * Math.min(1, t * 1.15 - i * 0.05))),
        }))
      )
      if (t < 1) {
        requestAnimationFrame(tick)
      } else {
        pending.forEach((f) => actions.addAsset(f.input))
        setDone(true)
        window.setTimeout(() => onOpenChange(false), 900)
      }
    }
    requestAnimationFrame(tick)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (uploading) return
    const files = Array.from(e.dataTransfer.files)
    startMockUpload(files.length || 2, files.map((f) => f.name))
  }

  function onBrowse(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    startMockUpload(files.length, files.map((f) => f.name))
    e.target.value = ""
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !uploading && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!uploading}>
        <DialogHeader>
          <DialogTitle className="text-title">Upload assets</DialogTitle>
          <DialogDescription>
            Images, videos, documents and design files. This prototype simulates
            the upload with sample imagery.
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
              <p className="text-sm font-medium">
                {dragging ? "Drop to upload" : "Drag files here"}
              </p>
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
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={onBrowse}
            />
          </div>
        ) : (
          <ul className="flex flex-col gap-3 rounded-xl bg-surface p-4 ring-1 ring-foreground/5">
            {queue.map((file) => (
              <li key={file.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                    file.progress >= 100
                      ? "bg-success text-white"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {file.progress >= 100 ? (
                    <RiCheckLine className="size-3.5 animate-in zoom-in-50 duration-200" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-current" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm">{file.name}</span>
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                      {file.progress}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className="h-full rounded-full bg-foreground/70 transition-[width] duration-100 ease-linear"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
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
            <Button onClick={() => startMockUpload(3)} disabled={!target}>
              Add sample files
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
