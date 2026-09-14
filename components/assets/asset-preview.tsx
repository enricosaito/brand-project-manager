"use client"

import * as React from "react"
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiPencilLine,
  RiPlayFill,
} from "@remixicon/react"

import { FadeImage } from "@/components/app/fade-image"
import { Field } from "@/components/app/field"
import { MemberAvatar } from "@/components/app/member-avatar"
import { FileGlyph } from "@/components/assets/file-glyph"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  formatBytes,
  formatDate,
  formatDimensions,
  formatDuration,
  formatTime,
} from "@/lib/format"
import { assetTypeLabel } from "@/lib/labels"
import { useMember, useProject, useWorkspace } from "@/lib/store/workspace"
import type { Asset } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AssetPreviewProps {
  asset: Asset | null
  /** The list the asset belongs to, for previous/next navigation. */
  assets?: Asset[]
  onOpenChange: (open: boolean) => void
  onNavigate?: (asset: Asset) => void
  showProject?: boolean
}

export function AssetPreview({
  asset,
  assets = [],
  onOpenChange,
  onNavigate,
  showProject = false,
}: AssetPreviewProps) {
  const index = asset ? assets.findIndex((a) => a.id === asset.id) : -1
  const prev = index > 0 ? assets[index - 1] : undefined
  const next = index >= 0 && index < assets.length - 1 ? assets[index + 1] : undefined

  React.useEffect(() => {
    if (!asset) return
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return
      if (e.key === "ArrowLeft" && prev) onNavigate?.(prev)
      if (e.key === "ArrowRight" && next) onNavigate?.(next)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [asset, prev, next, onNavigate])

  return (
    <Dialog open={Boolean(asset)} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(860px,calc(100svh-2rem))] w-[calc(100vw-2rem)] max-w-[1280px] flex-col overflow-hidden p-0 sm:max-w-[1280px] lg:grid lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        {asset && (
          <>
            <DialogTitle className="sr-only">{asset.name}</DialogTitle>
            <Stage asset={asset} prev={prev} next={next} onNavigate={onNavigate}>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close preview"
                className="absolute top-4 left-4 flex size-8 items-center justify-center rounded-md bg-white/10 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white focus-visible:ring-3 focus-visible:ring-white/40 outline-none"
              >
                <RiCloseLine className="size-4" />
              </button>
              {index >= 0 && assets.length > 1 && (
                <span className="absolute top-4 right-4 rounded-md bg-white/10 px-2 py-1 font-mono text-[11px] text-white/70 tabular-nums backdrop-blur-sm">
                  {index + 1} / {assets.length}
                </span>
              )}
            </Stage>
            <DetailsPanel
              key={asset.id}
              asset={asset}
              showProject={showProject}
              onDeleted={() => onOpenChange(false)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Stage({
  asset,
  prev,
  next,
  onNavigate,
  children,
}: {
  asset: Asset
  prev?: Asset
  next?: Asset
  onNavigate?: (asset: Asset) => void
  children?: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[oklch(0.13_0.005_75)] lg:h-full">
      {asset.previewUrl ? (
        <div key={asset.id} className="absolute inset-0 p-4 sm:p-10 animate-in fade-in-0 zoom-in-[0.98] duration-300 ease-out-quart">
          <div className="relative size-full">
            <FadeImage
              src={asset.previewUrl}
              alt={asset.name}
              fill
              priority
              sizes="(min-width: 1024px) 900px, 100vw"
              className="object-contain"
            />
          </div>
        </div>
      ) : (
        <div key={asset.id} className="flex flex-col items-center gap-6 animate-in fade-in-0 zoom-in-[0.98] duration-300 ease-out-quart">
          <FileGlyph extension={asset.extension} type={asset.type} size="lg" />
          <div className="text-center">
            <div className="text-sm font-medium text-white/90">{asset.name}</div>
            <div className="mt-1 text-xs text-white/50">
              No preview available for this file type
            </div>
          </div>
        </div>
      )}

      {asset.type === "video" && (
        <button
          type="button"
          aria-label="Play video"
          className="absolute flex size-16 items-center justify-center rounded-full bg-white/90 text-black shadow-xl transition-transform duration-200 ease-out-quart hover:scale-105 focus-visible:ring-3 focus-visible:ring-white/40 outline-none"
        >
          <RiPlayFill className="ml-1 size-7" />
        </button>
      )}

      {prev && (
        <NavButton side="left" onClick={() => onNavigate?.(prev)} />
      )}
      {next && (
        <NavButton side="right" onClick={() => onNavigate?.(next)} />
      )}
      {children}
    </div>
  )
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? RiArrowLeftSLine : RiArrowRightSLine
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous asset" : "Next asset"}
      className={cn(
        "absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white focus-visible:ring-3 focus-visible:ring-white/40 outline-none",
        side === "left" ? "left-4" : "right-4"
      )}
    >
      <Icon className="size-5" />
    </button>
  )
}

function DetailsPanel({
  asset,
  showProject,
  onDeleted,
}: {
  asset: Asset
  showProject: boolean
  onDeleted: () => void
}) {
  const { actions } = useWorkspace()
  const uploader = useMember(asset.uploadedById)
  const project = useProject(asset.projectId)
  const [editing, setEditing] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [download, setDownload] = React.useState<"idle" | "preparing" | "done">("idle")

  const [draft, setDraft] = React.useState({
    name: asset.name,
    description: asset.description ?? "",
    tags: asset.tags.join(", "),
  })

  function save() {
    actions.updateAsset(asset.id, {
      name: draft.name.trim() || asset.name,
      description: draft.description.trim() || undefined,
      tags: draft.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    })
    setEditing(false)
  }

  function mockDownload() {
    if (download !== "idle") return
    setDownload("preparing")
    window.setTimeout(() => setDownload("done"), 900)
    window.setTimeout(() => setDownload("idle"), 2600)
  }

  const dimensions = formatDimensions(asset.width, asset.height)

  return (
    <aside className="flex min-h-0 flex-col border-t border-border bg-popover lg:h-full lg:border-t-0 lg:border-l">
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {editing ? (
          <div className="space-y-5">
            <Field label="File name" htmlFor="asset-name">
              <Input
                id="asset-name"
                autoFocus
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </Field>
            <Field label="Description" htmlFor="asset-description">
              <Textarea
                id="asset-description"
                value={draft.description}
                placeholder="Add a short description"
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </Field>
            <Field label="Tags" htmlFor="asset-tags" hint="Separate tags with commas.">
              <Input
                id="asset-tags"
                value={draft.tags}
                placeholder="logo, final"
                onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
              />
            </Field>
          </div>
        ) : (
          <>
            <h2 className="text-title break-words">{asset.name}</h2>
            {asset.description && (
              <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                {asset.description}
              </p>
            )}

            <dl className="mt-6 grid grid-cols-[6.5rem_1fr] gap-x-4 gap-y-3 text-sm">
              <Detail label="Type">
                {assetTypeLabel(asset.type)}
                <span className="ml-1.5 font-mono text-xs text-muted-foreground uppercase">
                  {asset.extension}
                </span>
              </Detail>
              {dimensions && <Detail label="Dimensions">{dimensions}</Detail>}
              {asset.duration !== undefined && (
                <Detail label="Duration">{formatDuration(asset.duration)}</Detail>
              )}
              <Detail label="File size">{formatBytes(asset.size)}</Detail>
              <Detail label="Uploaded by">
                <span className="inline-flex items-center gap-2">
                  <MemberAvatar member={uploader} size="xs" />
                  {uploader?.name ?? "Unknown"}
                </span>
              </Detail>
              <Detail label="Date">
                {formatDate(asset.createdAt, true)}
                <span className="ml-1.5 text-muted-foreground">
                  {formatTime(asset.createdAt)}
                </span>
              </Detail>
              {showProject && project && <Detail label="Project">{project.name}</Detail>}
              <Detail label="Tags">
                {asset.tags.length > 0 ? (
                  <span className="flex flex-wrap gap-1">
                    {asset.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-sm bg-secondary px-1.5 py-0.5 text-xs text-foreground/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No tags</span>
                )}
              </Detail>
            </dl>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-border px-6 py-4">
        {editing ? (
          <>
            <Button onClick={save} className="flex-1">
              Save
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </>
        ) : confirmDelete ? (
          <>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                actions.deleteAsset(asset.id)
                onDeleted()
              }}
            >
              Delete permanently
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Keep
            </Button>
          </>
        ) : (
          <>
            <Button onClick={mockDownload} className="flex-1 transition-all">
              {download === "done" ? (
                <RiCheckLine data-icon="inline-start" />
              ) : (
                <RiDownloadLine data-icon="inline-start" />
              )}
              {download === "idle"
                ? "Download"
                : download === "preparing"
                  ? "Preparing…"
                  : "Downloaded"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Edit details"
              onClick={() => setEditing(true)}
            >
              <RiPencilLine />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Delete asset"
              className="hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <RiDeleteBinLine />
            </Button>
          </>
        )}
      </div>
    </aside>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground/90">{children}</dd>
    </>
  )
}
