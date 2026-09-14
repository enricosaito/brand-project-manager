"use client"

import * as React from "react"

import { Field } from "@/components/app/field"
import { FormSelect } from "@/components/app/filter-select"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/labels"
import { useMembers, useWorkspace } from "@/lib/store/workspace"
import type { Task, TaskPriority, TaskStatus } from "@/lib/types"

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  /** Edit this task; omit to create. */
  task?: Task | null
  /** Preselect a status when creating from a board column. */
  defaultStatus?: TaskStatus
}

interface FormState {
  title: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string
  dueDate: string
}

const UNASSIGNED = "unassigned"

export function TaskDialog({
  open,
  onOpenChange,
  projectId,
  task,
  defaultStatus = "todo",
}: TaskDialogProps) {
  const { actions } = useWorkspace()
  const members = useMembers()
  const [form, setForm] = React.useState<FormState>(() => toForm(task, defaultStatus))
  const [submitted, setSubmitted] = React.useState(false)
  const isEdit = Boolean(task)

  React.useEffect(() => {
    if (open) {
      setForm(toForm(task, defaultStatus))
      setSubmitted(false)
    }
  }, [open, task, defaultStatus])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const invalid = submitted && form.title.trim() === ""

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (form.title.trim() === "") return

    const input = {
      projectId,
      title: form.title.trim(),
      status: form.status,
      priority: form.priority,
      assigneeId: form.assigneeId === UNASSIGNED ? undefined : form.assigneeId,
      dueDate: form.dueDate || undefined,
    }

    if (task) {
      actions.updateTask(task.id, input)
    } else {
      actions.createTask(input)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="contents">
          <DialogHeader>
            <DialogTitle className="text-title">
              {isEdit ? "Edit task" : "New task"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <Field label="Title" htmlFor="task-title">
              <Input
                id="task-title"
                autoFocus
                placeholder="What needs to happen?"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                aria-invalid={invalid || undefined}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Status" htmlFor="task-status">
                <FormSelect
                  id="task-status"
                  value={form.status}
                  onValueChange={(v) => update("status", v)}
                  options={TASK_STATUSES}
                />
              </Field>
              <Field label="Priority" htmlFor="task-priority">
                <FormSelect
                  id="task-priority"
                  value={form.priority}
                  onValueChange={(v) => update("priority", v)}
                  options={TASK_PRIORITIES}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Assignee" htmlFor="task-assignee">
                <FormSelect
                  id="task-assignee"
                  value={form.assigneeId}
                  onValueChange={(v) => update("assigneeId", v)}
                  options={[
                    { value: UNASSIGNED, label: "Unassigned" },
                    ...members.map((m) => ({ value: m.id, label: m.name })),
                  ]}
                />
              </Field>
              <Field label="Due date" htmlFor="task-due">
                <Input
                  id="task-due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => update("dueDate", e.target.value)}
                />
              </Field>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? "Save changes" : "Create task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function toForm(task: Task | null | undefined, defaultStatus: TaskStatus): FormState {
  return {
    title: task?.title ?? "",
    status: task?.status ?? defaultStatus,
    priority: task?.priority ?? "medium",
    assigneeId: task?.assigneeId ?? UNASSIGNED,
    dueDate: task?.dueDate ?? "",
  }
}
