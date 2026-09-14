"use client"

import * as React from "react"
import {
  RiCheckLine,
  RiDeleteBinLine,
  RiMoreLine,
  RiPencilLine,
} from "@remixicon/react"

import { MemberAvatar } from "@/components/app/member-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { daysUntil, formatDue } from "@/lib/format"
import { TASK_STATUSES, taskPriorityMeta } from "@/lib/labels"
import { useMember, useWorkspace } from "@/lib/store/workspace"
import type { Task, TaskStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TaskItemProps {
  task: Task
  onEdit: (task: Task) => void
  /** Compact rows for overview panels: no menu, tighter spacing. */
  compact?: boolean
  className?: string
}

export function TaskItem({ task, onEdit, compact = false, className }: TaskItemProps) {
  const { actions } = useWorkspace()
  const assignee = useMember(task.assigneeId)
  const done = task.status === "done"
  const priority = taskPriorityMeta(task.priority)
  const overdue = !done && task.dueDate ? daysUntil(task.dueDate) < 0 : false
  const soon = !done && task.dueDate ? daysUntil(task.dueDate) <= 2 : false

  function toggleDone() {
    actions.updateTask(task.id, { status: done ? "todo" : "done" })
  }

  return (
    <div
      className={cn(
        "group/task flex items-center gap-3 rounded-lg px-2 transition-colors duration-150 hover:bg-foreground/[0.035]",
        compact ? "-mx-2 h-10" : "-mx-2 h-11",
        className
      )}
    >
      <CompleteToggle done={done} onToggle={toggleDone} />

      <button
        type="button"
        onClick={() => onEdit(task)}
        className={cn(
          "min-w-0 flex-1 truncate text-left text-sm outline-none transition-colors duration-200",
          done ? "text-muted-foreground line-through decoration-foreground/30" : "text-foreground",
          "focus-visible:underline focus-visible:underline-offset-4"
        )}
      >
        {task.title}
      </button>

      {!done && task.priority !== "low" && (
        <span
          className={cn(
            "hidden shrink-0 items-center gap-1 text-[11px] font-medium sm:inline-flex",
            priority.className
          )}
        >
          <PriorityGlyph level={task.priority} />
          {priority.label}
        </span>
      )}

      {task.dueDate && (
        <span
          className={cn(
            "shrink-0 text-xs tabular-nums",
            done
              ? "text-muted-foreground/60"
              : overdue
                ? "text-destructive"
                : soon
                  ? "text-foreground"
                  : "text-muted-foreground"
          )}
        >
          {formatDue(task.dueDate)}
        </span>
      )}

      <MemberAvatar member={assignee} size="sm" withTooltip />

      {!compact && (
        <TaskMenu
          status={task.status}
          onStatus={(s) => actions.updateTask(task.id, { status: s })}
          onEdit={() => onEdit(task)}
          onDelete={() => actions.deleteTask(task.id)}
        />
      )}
    </div>
  )
}

export function CompleteToggle({
  done,
  onToggle,
  className,
}: {
  done: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? "Mark as not done" : "Mark as done"}
      onClick={onToggle}
      className={cn(
        "flex size-[18px] shrink-0 items-center justify-center rounded-full border outline-none transition-[background-color,border-color,transform] duration-200 ease-out-quart focus-visible:ring-3 focus-visible:ring-ring/30 active:scale-90",
        done
          ? "border-success bg-success text-white"
          : "border-foreground/25 text-transparent hover:border-foreground/60 hover:text-foreground/40",
        className
      )}
    >
      <RiCheckLine className="size-3" strokeWidth={3} />
    </button>
  )
}

export function PriorityGlyph({ level }: { level: "low" | "medium" | "high" }) {
  const bars = level === "high" ? 3 : level === "medium" ? 2 : 1
  return (
    <span className="inline-flex items-end gap-px" aria-hidden>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-[1px]",
            i <= bars ? "bg-current" : "bg-current opacity-25",
            i === 1 ? "h-1.5" : i === 2 ? "h-2" : "h-2.5"
          )}
        />
      ))}
    </span>
  )
}

export function TaskMenu({
  status,
  onStatus,
  onEdit,
  onDelete,
  className,
}: {
  status: TaskStatus
  onStatus: (s: TaskStatus) => void
  onEdit: () => void
  onDelete: () => void
  className?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Task actions"
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-[opacity,background-color] outline-none group-hover/task:opacity-100 hover:bg-foreground/5 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/30 data-popup-open:opacity-100 data-popup-open:bg-foreground/5",
          className
        )}
      >
        <RiMoreLine className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup value={status} onValueChange={(v) => onStatus(v as TaskStatus)}>
          <DropdownMenuLabel>Move to</DropdownMenuLabel>
          {TASK_STATUSES.map((s) => (
            <DropdownMenuRadioItem key={s.value} value={s.value}>
              <span className={cn("size-1.5 rounded-full", s.dot)} />
              {s.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onEdit}>
          <RiPencilLine />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <RiDeleteBinLine />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
