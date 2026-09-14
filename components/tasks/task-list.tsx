"use client"

import * as React from "react"
import { RiAddLine, RiCheckboxCircleLine, RiLayoutColumnLine, RiListCheck2 } from "@remixicon/react"

import { EmptyState } from "@/components/app/empty-state"
import { MemberAvatar } from "@/components/app/member-avatar"
import { TaskDialog } from "@/components/tasks/task-dialog"
import { CompleteToggle, PriorityGlyph, TaskItem, TaskMenu } from "@/components/tasks/task-item"
import { Button } from "@/components/ui/button"
import { daysUntil, formatDue } from "@/lib/format"
import { TASK_STATUSES, taskPriorityMeta } from "@/lib/labels"
import { useMember, useTasks, useWorkspace } from "@/lib/store/workspace"
import type { Task, TaskStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

type View = "list" | "board"

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const

function sortTasks(list: Task[]) {
  return [...list].sort((a, b) => {
    const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (p !== 0) return p
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return b.createdAt.localeCompare(a.createdAt)
  })
}

export function TaskList({ projectId }: { projectId: string }) {
  const tasks = useTasks(projectId)
  const [view, setView] = React.useState<View>("list")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = React.useState<TaskStatus>("todo")

  function openCreate(status: TaskStatus = "todo") {
    setEditing(null)
    setDefaultStatus(status)
    setDialogOpen(true)
  }

  function openEdit(task: Task) {
    setEditing(task)
    setDialogOpen(true)
  }

  const grouped = React.useMemo(
    () =>
      TASK_STATUSES.map((s) => ({
        ...s,
        tasks: sortTasks(tasks.filter((t) => t.status === s.value)),
      })),
    [tasks]
  )

  const doneCount = tasks.filter((t) => t.status === "done").length

  return (
    <div>
      {tasks.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <ViewToggle value={view} onChange={setView} />
            <span className="text-xs text-muted-foreground tabular-nums">
              {doneCount} of {tasks.length} done
            </span>
          </div>
          <Button onClick={() => openCreate()}>
            <RiAddLine data-icon="inline-start" />
            New task
          </Button>
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState
          icon={<RiCheckboxCircleLine />}
          title="No tasks"
          description="Nothing on the board yet. Add the first thing that needs to happen."
          action={
            <Button onClick={() => openCreate()}>
              <RiAddLine data-icon="inline-start" />
              Create task
            </Button>
          }
        />
      ) : view === "list" ? (
        <div className="mt-6 space-y-8">
          {grouped
            .filter((g) => g.tasks.length > 0)
            .map((group) => (
              <section key={group.value}>
                <header className="mb-1 flex items-center gap-2 px-0.5">
                  <span className={cn("size-1.5 rounded-full", group.dot)} />
                  <h3 className="text-sm font-medium">{group.label}</h3>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {group.tasks.length}
                  </span>
                </header>
                <div className="divide-y divide-border/60">
                  {group.tasks.map((task) => (
                    <div key={task.id} className="animate-in fade-in-0 duration-200">
                      <TaskItem task={task} onEdit={openEdit} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
        </div>
      ) : (
        <div className="scrollbar-thin -mx-1 mt-6 overflow-x-auto px-1 pb-2">
          <div className="grid min-w-[52rem] grid-cols-4 gap-4">
            {grouped.map((group) => (
              <BoardColumn
                key={group.value}
                label={group.label}
                dot={group.dot}
                tasks={group.tasks}
                onAdd={() => openCreate(group.value)}
                onEdit={openEdit}
              />
            ))}
          </div>
        </div>
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        task={editing}
        defaultStatus={defaultStatus}
      />
    </div>
  )
}

function ViewToggle({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  const options: { value: View; label: string; icon: typeof RiListCheck2 }[] = [
    { value: "list", label: "List", icon: RiListCheck2 },
    { value: "board", label: "Board", icon: RiLayoutColumnLine },
  ]
  return (
    <div role="radiogroup" className="flex h-8 items-center gap-0.5 rounded-lg bg-muted p-0.5">
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex h-full items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-[background-color,color,box-shadow] duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
              active
                ? "bg-background text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-foreground/5"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <opt.icon className="size-3.5" />
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function BoardColumn({
  label,
  dot,
  tasks,
  onAdd,
  onEdit,
}: {
  label: string
  dot: string
  tasks: Task[]
  onAdd: () => void
  onEdit: (task: Task) => void
}) {
  return (
    <section className="flex min-h-[24rem] flex-col rounded-xl bg-surface p-2 ring-1 ring-foreground/5">
      <header className="flex items-center gap-2 px-2 py-2">
        <span className={cn("size-1.5 rounded-full", dot)} />
        <h3 className="text-sm font-medium">{label}</h3>
        <span className="text-xs text-muted-foreground tabular-nums">{tasks.length}</span>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add task to ${label}`}
          className="ml-auto flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 outline-none"
        >
          <RiAddLine className="size-4" />
        </button>
      </header>
      <div className="flex flex-1 flex-col gap-2">
        {tasks.map((task) => (
          <BoardCard key={task.id} task={task} onEdit={onEdit} />
        ))}
        {tasks.length === 0 && (
          <button
            type="button"
            onClick={onAdd}
            className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/80 text-xs text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
          >
            Add a task
          </button>
        )}
      </div>
    </section>
  )
}

function BoardCard({ task, onEdit }: { task: Task; onEdit: (task: Task) => void }) {
  const { actions } = useWorkspace()
  const assignee = useMember(task.assigneeId)
  const done = task.status === "done"
  const priority = taskPriorityMeta(task.priority)
  const overdue = !done && task.dueDate ? daysUntil(task.dueDate) < 0 : false

  return (
    <div className="group/task relative rounded-lg bg-card p-3 ring-1 ring-foreground/[0.06] transition-[box-shadow,transform] duration-200 ease-out-quart hover:-translate-y-px hover:shadow-[0_6px_16px_-8px_rgba(0,0,0,0.2)] animate-in fade-in-0 duration-200">
      <div className="flex items-start gap-2.5">
        <CompleteToggle
          done={done}
          onToggle={() => actions.updateTask(task.id, { status: done ? "todo" : "done" })}
          className="mt-0.5"
        />
        <button
          type="button"
          onClick={() => onEdit(task)}
          className={cn(
            "min-w-0 flex-1 text-left text-sm leading-snug outline-none focus-visible:underline focus-visible:underline-offset-4",
            done && "text-muted-foreground line-through decoration-foreground/30"
          )}
        >
          {task.title}
        </button>
        <TaskMenu
          status={task.status}
          onStatus={(s) => actions.updateTask(task.id, { status: s })}
          onEdit={() => onEdit(task)}
          onDelete={() => actions.deleteTask(task.id)}
          className="-mt-1 -mr-1"
        />
      </div>
      <div className="mt-3 flex items-center gap-2 pl-7 text-[11px] text-muted-foreground">
        {task.priority !== "low" && !done && (
          <span className={cn("inline-flex items-center gap-1 font-medium", priority.className)}>
            <PriorityGlyph level={task.priority} />
            {priority.label}
          </span>
        )}
        {task.dueDate && (
          <span className={cn("tabular-nums", overdue && "text-destructive")}>
            {formatDue(task.dueDate)}
          </span>
        )}
        <span className="ml-auto">
          <MemberAvatar member={assignee} size="xs" withTooltip />
        </span>
      </div>
    </div>
  )
}
