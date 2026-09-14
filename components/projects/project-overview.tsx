"use client"

import * as React from "react"
import Link from "next/link"
import { RiArrowRightLine } from "@remixicon/react"

import { ActivityTimeline } from "@/components/activity/activity-timeline"
import { MemberAvatar } from "@/components/app/member-avatar"
import { SectionHeader } from "@/components/app/page-header"
import { AssetGrid } from "@/components/assets/asset-grid"
import { AssetPreview } from "@/components/assets/asset-preview"
import { TaskDialog } from "@/components/tasks/task-dialog"
import { TaskItem } from "@/components/tasks/task-item"
import { daysUntil, formatDate, formatDue, pluralize } from "@/lib/format"
import { TASK_STATUSES } from "@/lib/labels"
import {
  useActivity,
  useAsset,
  useAssets,
  useBasePath,
  useMember,
  useProjectStats,
  useTasks,
} from "@/lib/store/workspace"
import type { Project, Task } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ProjectOverview({ project }: { project: Project }) {
  const assets = useAssets(project.id)
  const tasks = useTasks(project.id)
  const activity = useActivity(project.id)
  const stats = useProjectStats(project.id)
  const base = `${useBasePath()}/projects/${project.id}`

  const [previewId, setPreviewId] = React.useState<string | null>(null)
  const previewAsset = useAsset(previewId) ?? null
  const [editing, setEditing] = React.useState<Task | null>(null)

  const recentAssets = React.useMemo(
    () => [...assets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
    [assets]
  )

  const openTasks = React.useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "done")
        .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"))
        .slice(0, 5),
    [tasks]
  )

  const upcoming = React.useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "done" && t.dueDate)
        .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
        .slice(0, 5),
    [tasks]
  )

  const byStatus = TASK_STATUSES.map((s) => ({
    ...s,
    count: tasks.filter((t) => t.status === s.value).length,
  }))

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
      <div className="min-w-0 space-y-12">
        {/* Progress */}
        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm">
              <span className="font-heading text-2xl font-medium tracking-tight tabular-nums">
                {stats.progress}%
              </span>
              <span className="ml-2 text-muted-foreground">
                {stats.doneCount} of {pluralize(stats.taskCount, "task")} complete
              </span>
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {project.status === "completed" ? (
                <>Completed · Due was {formatDate(project.dueDate, true)}</>
              ) : (
                <>
                  Due {formatDate(project.dueDate, true)}
                  <span className="mx-1.5 text-foreground/30">·</span>
                  <DueHint date={project.dueDate} />
                </>
              )}
            </p>
          </div>
          <div className="mt-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-foreground/[0.07]">
            {byStatus
              .filter((s) => s.count > 0)
              .map((s) => (
                <span
                  key={s.value}
                  className={cn(
                    "h-full transition-[width] duration-500 ease-out-quart",
                    s.value === "done"
                      ? "bg-success"
                      : s.value === "review"
                        ? "bg-warning"
                        : s.value === "in-progress"
                          ? "bg-brand"
                          : "bg-foreground/15"
                  )}
                  style={{ width: `${(s.count / Math.max(1, stats.taskCount)) * 100}%` }}
                />
              ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            {byStatus.map((s) => (
              <span key={s.value} className="inline-flex items-center gap-1.5">
                <span className={cn("size-1.5 rounded-full", s.dot)} />
                <span className="tabular-nums">{s.count}</span> {s.label}
              </span>
            ))}
          </div>
        </section>

        {/* Recent assets */}
        <section>
          <SectionHeader
            title="Recent assets"
            count={assets.length}
            action={<MoreLink href={`${base}/assets`}>All assets</MoreLink>}
          />
          {recentAssets.length > 0 ? (
            <AssetGrid
              dense
              assets={recentAssets}
              onOpen={(a) => setPreviewId(a.id)}
              className="mt-5"
            />
          ) : (
            <QuietEmpty>
              No assets yet.{" "}
              <Link href={`${base}/assets`} className="text-foreground underline underline-offset-4">
                Upload the first one
              </Link>
              .
            </QuietEmpty>
          )}
        </section>

        {/* Open tasks */}
        <section>
          <SectionHeader
            title="Open tasks"
            count={stats.openCount}
            action={<MoreLink href={`${base}/tasks`}>All tasks</MoreLink>}
          />
          {openTasks.length > 0 ? (
            <div className="mt-3 divide-y divide-border/60">
              {openTasks.map((task) => (
                <TaskItem key={task.id} task={task} onEdit={setEditing} compact />
              ))}
            </div>
          ) : (
            <QuietEmpty>
              {tasks.length === 0 ? "Nothing on the board yet." : "Everything is done. Nice work."}
            </QuietEmpty>
          )}
        </section>
      </div>

      {/* Side column */}
      <aside className="space-y-12">
        <section>
          <SectionHeader title="Upcoming" />
          {upcoming.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-3">
              {upcoming.map((task) => (
                <Deadline key={task.id} task={task} onClick={() => setEditing(task)} />
              ))}
            </ul>
          ) : (
            <QuietEmpty>No upcoming deadlines.</QuietEmpty>
          )}
        </section>

        <section>
          <SectionHeader
            title="Activity"
            action={<MoreLink href={`${base}/activity`}>All activity</MoreLink>}
          />
          <div className="mt-1">
            <ActivityTimeline events={activity} limit={5} compact />
          </div>
        </section>
      </aside>

      <AssetPreview
        asset={previewAsset}
        assets={recentAssets}
        onOpenChange={(open) => !open && setPreviewId(null)}
        onNavigate={(a) => setPreviewId(a.id)}
      />
      <TaskDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        projectId={project.id}
        task={editing}
      />
    </div>
  )
}

function Deadline({ task, onClick }: { task: Task; onClick: () => void }) {
  const assignee = useMember(task.assigneeId)
  const days = daysUntil(task.dueDate!)
  const overdue = days < 0
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="group/deadline -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-foreground/[0.035] outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <span
          className={cn(
            "flex w-12 shrink-0 flex-col items-start leading-none",
            overdue ? "text-destructive" : days <= 2 ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <span className="text-xs font-medium tabular-nums">{formatDue(task.dueDate!)}</span>
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px]">{task.title}</span>
        <MemberAvatar member={assignee} size="xs" withTooltip />
      </button>
    </li>
  )
}

function DueHint({ date }: { date: string }) {
  const days = daysUntil(date)
  if (days < 0) return <span className="text-destructive">{Math.abs(days)} days overdue</span>
  if (days === 0) return <span>Due today</span>
  return <span>{days} days left</span>
}

function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group/more inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
      <RiArrowRightLine className="size-3.5 transition-transform duration-200 ease-out-quart group-hover/more:translate-x-0.5" />
    </Link>
  )
}

function QuietEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}
