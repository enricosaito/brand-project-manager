"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  RiArrowLeftLine,
  RiDeleteBinLine,
  RiMoreLine,
  RiPencilLine,
  RiShareLine,
} from "@remixicon/react"

import { FadeImage } from "@/components/app/fade-image"
import { MemberAvatar } from "@/components/app/member-avatar"
import { ProjectSheet } from "@/components/projects/project-sheet"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDateRange } from "@/lib/format"
import { PROJECT_STATUSES, projectStatusMeta, projectTypeLabel } from "@/lib/labels"
import { useMember, useWorkspace } from "@/lib/store/workspace"
import type { Project, ProjectStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ProjectHeader({ project }: { project: Project }) {
  const owner = useMember(project.ownerId)
  const { actions } = useWorkspace()
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const status = projectStatusMeta(project.status)

  return (
    <div>
      {/* Cover */}
      <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/5 sm:h-56 lg:h-64">
        <FadeImage
          src={project.coverUrl}
          alt=""
          fill
          priority
          sizes="(min-width: 1400px) 1300px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        <Link
          href="/projects"
          className="absolute top-4 left-4 flex h-8 items-center gap-1.5 rounded-md bg-background/85 pr-3 pl-2 text-xs font-medium text-foreground ring-1 ring-foreground/10 backdrop-blur-sm transition-colors hover:bg-background"
        >
          <RiArrowLeftLine className="size-3.5" />
          Projects
        </Link>
      </div>

      {/* Title block */}
      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{projectTypeLabel(project.type)}</span>
            <span className="text-foreground/30">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className={cn("size-1.5 rounded-full", status.dot)} />
              {status.label}
            </span>
          </div>
          <h1 className="mt-2 text-display text-balance sm:text-[2.5rem]">
            {project.name}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-pretty text-muted-foreground">
            {project.description}
          </p>

          <dl className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
            <div className="flex items-center gap-2.5">
              <dt className="sr-only">Owner</dt>
              <MemberAvatar member={owner} size="sm" />
              <dd className="text-foreground/80">{owner?.name}</dd>
            </div>
            <div className="flex items-center gap-2.5">
              <dt className="text-muted-foreground">Timeline</dt>
              <dd className="text-foreground/80 tabular-nums">
                {formatDateRange(project.startDate, project.dueDate)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <StatusMenu
            value={project.status}
            onChange={(s) => actions.updateProject(project.id, { status: s })}
          />
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <RiPencilLine data-icon="inline-start" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="icon" aria-label="More actions" />}
            >
              <RiMoreLine />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled>
                <RiShareLine />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  actions.deleteProject(project.id)
                  router.push("/projects")
                }}
              >
                <RiDeleteBinLine />
                Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ProjectSheet open={editOpen} onOpenChange={setEditOpen} project={project} />
    </div>
  )
}

function StatusMenu({
  value,
  onChange,
}: {
  value: ProjectStatus
  onChange: (status: ProjectStatus) => void
}) {
  const meta = projectStatusMeta(value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <span className={cn("size-1.5 rounded-full", meta.dot)} />
        {meta.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onChange(v as ProjectStatus)}
        >
          {PROJECT_STATUSES.map((s) => (
            <DropdownMenuRadioItem key={s.value} value={s.value}>
              <span className={cn("size-1.5 rounded-full", s.dot)} />
              {s.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
