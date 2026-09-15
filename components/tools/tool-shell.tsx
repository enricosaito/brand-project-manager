"use client"

import * as React from "react"
import { RiDownloadLine, RiImageAddLine, RiRefreshLine } from "@remixicon/react"

import { PageContainer } from "@/components/app/app-shell"
import { SaveToProjectButton } from "@/components/tools/save-to-project"
import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/format"
import { downloadBlob, percentSaved } from "@/lib/tools/image"
import { getTool, type ToolSlug } from "@/lib/tools/registry"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ page */

export function ToolPage({ slug, children }: { slug: ToolSlug; children: React.ReactNode }) {
  const tool = getTool(slug)
  if (!tool) return null
  return (
    <PageContainer>
      <div className="flex items-start gap-4">
        <span className="mt-1 hidden size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground/80 sm:flex">
          <tool.icon className="size-5" />
        </span>
        <div>
          <h1 className="text-display text-balance">{tool.name}</h1>
          <p className="mt-2 max-w-xl text-[15px] text-pretty text-muted-foreground">
            {tool.description}
          </p>
        </div>
      </div>
      <div className="mt-8">{children}</div>
    </PageContainer>
  )
}

/* ---------------------------------------------------------------- layout */

/** Two-column tool layout: stage on the left, controls on the right. */
export function ToolLayout({ stage, controls }: { stage: React.ReactNode; controls: React.ReactNode }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
      <div className="min-w-0">{stage}</div>
      <aside className="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">{controls}</aside>
    </div>
  )
}

export function Stage({
  children,
  checker = false,
  className,
}: {
  children: React.ReactNode
  checker?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-64 items-center justify-center overflow-hidden rounded-xl ring-1 ring-foreground/5",
        checker ? "bg-checker" : "bg-surface",
        className
      )}
    >
      {children}
    </div>
  )
}

export function ControlSection({
  title,
  children,
  className,
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {title && <h2 className="text-label text-muted-foreground">{title}</h2>}
      {children}
    </section>
  )
}

/* -------------------------------------------------------------- dropzone */

interface ImageDropzoneProps {
  onFiles: (files: File[]) => void
  multiple?: boolean
  accept?: string
  title?: string
  hint?: string
  className?: string
}

export function ImageDropzone({
  onFiles,
  multiple = false,
  accept = "image/*",
  title,
  hint,
  className,
}: ImageDropzoneProps) {
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  function handle(list: FileList | null) {
    const files = Array.from(list ?? [])
    if (files.length === 0) return
    onFiles(multiple ? files : files.slice(0, 1))
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handle(e.dataTransfer.files)
      }}
      className={cn(
        "flex min-h-72 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center outline-none transition-[border-color,background-color] duration-200 focus-visible:ring-3 focus-visible:ring-ring/30",
        dragging
          ? "border-foreground/50 bg-secondary"
          : "border-border bg-surface hover:border-foreground/30",
        className
      )}
    >
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-xl bg-card text-muted-foreground ring-1 ring-foreground/10 transition-transform duration-200 ease-out-quart",
          dragging && "-translate-y-0.5 text-foreground"
        )}
      >
        <RiImageAddLine className="size-5" />
      </div>
      <div>
        <p className="text-sm font-medium">
          {dragging ? "Drop to load" : (title ?? (multiple ? "Drop images here" : "Drop an image here"))}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {hint ?? "or click to browse. Files never leave your browser."}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handle(e.target.files)
          e.target.value = ""
        }}
      />
    </div>
  )
}

/* ---------------------------------------------------------------- output */

interface OutputActionsProps {
  blob: Blob | null
  filename: string
  sizeBefore?: number
  onReset?: () => void
  busy?: boolean
  saveable?: boolean
}

export function OutputActions({
  blob,
  filename,
  sizeBefore,
  onReset,
  busy = false,
  saveable = true,
}: OutputActionsProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface p-4 ring-1 ring-foreground/5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="min-w-0">
          <div className="truncate font-medium">{filename}</div>
          {blob && (
            <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              {formatBytes(blob.size)}
              {typeof sizeBefore === "number" && sizeBefore > 0 && (
                <SizeDelta before={sizeBefore} after={blob.size} className="ml-1.5" />
              )}
            </div>
          )}
        </div>
        {onReset && (
          <Button variant="ghost" size="icon-sm" aria-label="Start over" onClick={onReset} className="-mr-1 shrink-0 text-muted-foreground">
            <RiRefreshLine />
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Button disabled={!blob || busy} onClick={() => blob && downloadBlob(blob, filename)}>
          <RiDownloadLine data-icon="inline-start" />
          Download
        </Button>
        {saveable && blob && <SaveToProjectButton blob={blob} filename={filename} disabled={busy} />}
      </div>
    </div>
  )
}

export function SizeDelta({ before, after, className }: { before: number; after: number; className?: string }) {
  const pct = percentSaved(before, after)
  if (pct === 0) return null
  return (
    <span className={cn("tabular-nums", pct > 0 ? "text-success" : "text-warning", className)}>
      {pct > 0 ? `−${pct}%` : `+${Math.abs(pct)}%`}
    </span>
  )
}

/** Object URL for a blob, revoked when it changes or unmounts. */
export function useObjectUrl(blob: Blob | null | undefined) {
  const [url, setUrl] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!blob) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])
  return url
}

export function BusyBar({ label, fraction }: { label: string; fraction?: number }) {
  const determinate = typeof fraction === "number"
  return (
    <div className="w-full max-w-xs">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {determinate && <span className="tabular-nums">{Math.round(fraction * 100)}%</span>}
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/10">
        <div
          className={cn(
            "h-full rounded-full bg-foreground/70 transition-[width] duration-300",
            !determinate && "w-1/3 animate-pulse"
          )}
          style={determinate ? { width: `${Math.max(3, fraction * 100)}%` } : undefined}
        />
      </div>
    </div>
  )
}
