"use client"

import Link from "next/link"
import { RiArrowRightUpLine } from "@remixicon/react"

import { FadeImage } from "@/components/app/fade-image"
import { ProjectStatusBadge } from "@/components/app/status-badge"
import { formatRelative, pluralize } from "@/lib/format"
import { projectTypeLabel } from "@/lib/labels"
import { useProjectStats } from "@/lib/store/workspace"
import type { Project } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ProjectCardProps {
  project: Project
  className?: string
  /** Sizes hint for next/image. */
  sizes?: string
}

export function ProjectCard({
  project,
  className,
  sizes = "(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw",
}: ProjectCardProps) {
  const stats = useProjectStats(project.id)

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        "group/card block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
        className
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/5 transition-[transform,box-shadow] duration-300 ease-out-quart group-hover/card:-translate-y-0.5 group-hover/card:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.25)]">
        <FadeImage
          src={project.coverUrl}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 ease-out-quart group-hover/card:scale-[1.03]"
        />
        <div className="absolute top-3 left-3">
          <ProjectStatusBadge status={project.status} variant="pill" />
        </div>
        <div className="absolute right-3 bottom-3 flex size-8 translate-y-1 items-center justify-center rounded-md bg-background/90 text-foreground opacity-0 ring-1 ring-foreground/10 backdrop-blur-sm transition-[opacity,transform] duration-200 ease-out-quart group-hover/card:translate-y-0 group-hover/card:opacity-100">
          <RiArrowRightUpLine className="size-4" />
        </div>
      </div>

      {/* Meta */}
      <div className="px-0.5 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-title truncate">{project.name}</h3>
          <span className="shrink-0 text-xs text-muted-foreground">
            {projectTypeLabel(project.type)}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-pretty text-muted-foreground">
          {project.description}
        </p>

        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <ProgressMeter value={stats.progress} />
          <span className="text-foreground/40">·</span>
          <span className="tabular-nums">{pluralize(stats.assetCount, "asset")}</span>
          <span className="text-foreground/40">·</span>
          <span className="tabular-nums">{pluralize(stats.taskCount, "task")}</span>
          <span className="ml-auto truncate opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
            Updated {formatRelative(project.updatedAt)}
          </span>
        </div>
      </div>
    </Link>
  )
}

export function ProgressMeter({
  value,
  className,
  showLabel = true,
}: {
  value: number
  className?: string
  showLabel?: boolean
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative h-1 w-16 overflow-hidden rounded-full bg-foreground/10">
        <span
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out-quart",
            value === 100 ? "bg-success" : "bg-foreground/70"
          )}
          style={{ width: `${value}%` }}
        />
      </span>
      {showLabel && <span className="tabular-nums">{value}%</span>}
    </span>
  )
}
