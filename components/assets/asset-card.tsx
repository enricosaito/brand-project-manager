"use client"

import { RiPlayFill } from "@remixicon/react"

import { FadeImage } from "@/components/app/fade-image"
import { FileGlyph } from "@/components/assets/file-glyph"
import { formatDate, formatDuration } from "@/lib/format"
import type { Asset } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AssetCardProps {
  asset: Asset
  onOpen: (asset: Asset) => void
  /** Show which project the asset belongs to (global library). */
  projectName?: string
  className?: string
  sizes?: string
}

export function AssetCard({
  asset,
  onOpen,
  projectName,
  className,
  sizes = "(min-width: 1536px) 18vw, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw",
}: AssetCardProps) {
  const hasPreview = Boolean(asset.previewUrl)

  return (
    <button
      type="button"
      onClick={() => onOpen(asset)}
      className={cn(
        "group/asset flex w-full flex-col text-left outline-none",
        className
      )}
    >
      <div
        className={cn(
          "relative aspect-[4/3] w-full overflow-hidden rounded-lg ring-1 ring-foreground/5 transition-[box-shadow,transform] duration-300 ease-out-quart group-hover/asset:-translate-y-0.5 group-hover/asset:shadow-[0_10px_28px_-12px_rgba(0,0,0,0.25)] group-focus-visible/asset:ring-2 group-focus-visible/asset:ring-ring",
          hasPreview ? "bg-muted" : "bg-surface"
        )}
      >
        {hasPreview ? (
          <FadeImage
            src={asset.previewUrl!}
            alt=""
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-500 ease-out-quart group-hover/asset:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <FileGlyph
              extension={asset.extension}
              type={asset.type}
              className="transition-transform duration-300 ease-out-quart group-hover/asset:-translate-y-0.5"
            />
          </div>
        )}

        {asset.type === "video" && (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-background/90 text-foreground ring-1 ring-foreground/10 backdrop-blur-sm transition-transform duration-300 ease-out-quart group-hover/asset:scale-105">
                <RiPlayFill className="ml-0.5 size-4" />
              </span>
            </div>
            {asset.duration !== undefined && (
              <span className="absolute right-2 bottom-2 rounded-sm bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white tabular-nums backdrop-blur-sm">
                {formatDuration(asset.duration)}
              </span>
            )}
          </>
        )}

        {hasPreview && asset.type !== "image" && asset.type !== "video" && (
          <span className="absolute top-2 left-2 rounded-sm bg-background/90 px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider text-foreground uppercase ring-1 ring-foreground/10 backdrop-blur-sm">
            {asset.extension}
          </span>
        )}

        {asset.tags.length > 0 && hasPreview && (
          <div className="absolute inset-x-2 bottom-2 flex flex-wrap gap-1 opacity-0 transition-opacity duration-200 group-hover/asset:opacity-100">
            {asset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-sm bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80 ring-1 ring-foreground/10 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2.5 min-w-0 px-0.5">
        <div className="truncate text-[13px] font-medium text-foreground">
          {asset.name}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="uppercase">{asset.extension}</span>
          {projectName && (
            <>
              <span className="text-foreground/30">·</span>
              <span className="truncate">{projectName}</span>
            </>
          )}
          <span className="text-foreground/30">·</span>
          <span className="shrink-0">{formatDate(asset.createdAt)}</span>
        </div>
      </div>
    </button>
  )
}
