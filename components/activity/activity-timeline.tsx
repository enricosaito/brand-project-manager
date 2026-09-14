"use client"

import * as React from "react"
import {
  RiCheckLine,
  RiFlashlightLine,
  RiHistoryLine,
} from "@remixicon/react"

import { EmptyState } from "@/components/app/empty-state"
import { MemberAvatar } from "@/components/app/member-avatar"
import { daysUntil, formatDate, formatRelative, formatTime } from "@/lib/format"
import { projectStatusMeta, taskStatusMeta } from "@/lib/labels"
import { useMember, useProjects } from "@/lib/store/workspace"
import type { ActivityEvent, ProjectStatus, TaskStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ActivityTimelineProps {
  events: ActivityEvent[]
  /** Show which project each event belongs to. */
  showProject?: boolean
  /** Compact list without day grouping (overview panels). */
  compact?: boolean
  limit?: number
  className?: string
}

export function ActivityTimeline({
  events,
  showProject = false,
  compact = false,
  limit,
  className,
}: ActivityTimelineProps) {
  const list = limit ? events.slice(0, limit) : events

  if (list.length === 0) {
    return (
      <EmptyState
        size="section"
        icon={<RiHistoryLine />}
        title="No activity yet"
        description="Uploads, tasks and status changes will show up here."
      />
    )
  }

  if (compact) {
    return (
      <ol className={cn("flex flex-col", className)}>
        {list.map((event) => (
          <li key={event.id} className="animate-in fade-in-0 duration-200">
            <ActivityRow event={event} showProject={showProject} compact />
          </li>
        ))}
      </ol>
    )
  }

  const groups = groupByDay(list)

  return (
    <div className={cn("space-y-10", className)}>
      {groups.map((group) => (
        <section key={group.key}>
          <h3 className="text-label mb-3 text-muted-foreground">{group.label}</h3>
          <ol className="relative flex flex-col before:absolute before:top-3 before:bottom-3 before:left-[15px] before:w-px before:bg-border">
            {group.events.map((event) => (
              <li key={event.id} className="animate-in fade-in-0 duration-200">
                <ActivityRow event={event} showProject={showProject} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

function ActivityRow({
  event,
  showProject,
  compact = false,
}: {
  event: ActivityEvent
  showProject: boolean
  compact?: boolean
}) {
  const actor = useMember(event.actorId)
  const projects = useProjects()
  const project = showProject ? projects.find((p) => p.id === event.projectId) : undefined

  return (
    <div className={cn("relative flex items-start gap-3", compact ? "py-2" : "py-2.5")}>
      <span className="relative z-10 shrink-0">
        {actor ? (
          <MemberAvatar member={actor} size={compact ? "sm" : "md"} />
        ) : (
          <span
            className={cn(
              "flex items-center justify-center rounded-full bg-secondary text-muted-foreground ring-2 ring-background",
              compact ? "size-6" : "size-8"
            )}
          >
            {event.kind === "project.status" && event.detail === "completed" ? (
              <RiCheckLine className="size-3.5" />
            ) : (
              <RiFlashlightLine className="size-3.5" />
            )}
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className={cn("text-pretty", compact ? "text-[13px] leading-snug" : "text-sm leading-relaxed")}>
          <Sentence event={event} actorName={actor?.name} />
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {compact ? (
            formatRelative(event.createdAt)
          ) : (
            <>
              {formatTime(event.createdAt)}
              {project && (
                <>
                  <span className="mx-1.5 text-foreground/30">·</span>
                  {project.name}
                </>
              )}
            </>
          )}
          {compact && project && (
            <>
              <span className="mx-1.5 text-foreground/30">·</span>
              {project.name}
            </>
          )}
        </p>
      </div>
    </div>
  )
}

function Strong({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-foreground">{children}</span>
}

function Sentence({ event, actorName }: { event: ActivityEvent; actorName?: string }) {
  const actor = actorName ? <Strong>{actorName}</Strong> : <Strong>Someone</Strong>
  const target = <Strong>{event.target}</Strong>

  switch (event.kind) {
    case "project.created":
      return <>{actor} created the project {target}</>
    case "project.status": {
      const label = event.detail
        ? projectStatusMeta(event.detail as ProjectStatus).label
        : "updated"
      return (
        <>
          {target} was marked as <Strong>{label}</Strong>
        </>
      )
    }
    case "asset.uploaded":
      return <>{actor} uploaded {target}</>
    case "assets.added":
      return <>{target} were added</>
    case "asset.deleted":
      return <>{actor} deleted {target}</>
    case "task.created":
      return <>{actor} created a task: {target}</>
    case "task.status": {
      const label = event.detail
        ? taskStatusMeta(event.detail as TaskStatus).label
        : "a new status"
      return (
        <>
          {actor} moved {target} to <Strong>{label}</Strong>
        </>
      )
    }
    case "task.completed":
      return <>{actor} completed {target}</>
    case "task.deleted":
      return <>{actor} deleted the task {target}</>
  }
}

function groupByDay(events: ActivityEvent[]) {
  const groups: { key: string; label: string; events: ActivityEvent[] }[] = []
  for (const event of events) {
    const key = event.createdAt.slice(0, 10)
    let group = groups.find((g) => g.key === key)
    if (!group) {
      const diff = daysUntil(key)
      const label =
        diff === 0 ? "Today" : diff === -1 ? "Yesterday" : formatDate(key, true)
      group = { key, label, events: [] }
      groups.push(group)
    }
    group.events.push(event)
  }
  return groups
}
