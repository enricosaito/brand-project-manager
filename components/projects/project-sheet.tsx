"use client"

import * as React from "react"
import { RiCheckLine, RiUploadCloud2Line } from "@remixicon/react"

import { FadeImage } from "@/components/app/fade-image"
import { Field } from "@/components/app/field"
import { FormSelect } from "@/components/app/filter-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { COVER_OPTIONS, UPLOAD_SAMPLES } from "@/data"
import { todayISO } from "@/lib/format"
import { PROJECT_STATUSES, PROJECT_TYPES } from "@/lib/labels"
import { useCurrentMember, useWorkspace } from "@/lib/store/workspace"
import type { Project, ProjectInput, ProjectStatus, ProjectType } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ProjectSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided the sheet edits this project instead of creating one. */
  project?: Project
  onCreated?: (project: Project) => void
}

interface FormState {
  name: string
  description: string
  type: ProjectType
  status: ProjectStatus
  coverUrl: string
  startDate: string
  dueDate: string
}

function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, m - 1, d + days)
  return todayISO(date)
}

function initialForm(project?: Project): FormState {
  const today = todayISO()
  return {
    name: project?.name ?? "",
    description: project?.description ?? "",
    type: project?.type ?? "brand",
    status: project?.status ?? "planning",
    coverUrl:
      project?.coverUrl ??
      COVER_OPTIONS[Math.floor(Math.random() * COVER_OPTIONS.length)].url,
    startDate: project?.startDate ?? today,
    dueDate: project?.dueDate ?? addDays(today, 42),
  }
}

export function ProjectSheet({
  open,
  onOpenChange,
  project,
  onCreated,
}: ProjectSheetProps) {
  const { actions } = useWorkspace()
  const currentMember = useCurrentMember()
  const [form, setForm] = React.useState<FormState>(() => initialForm(project))
  const [submitted, setSubmitted] = React.useState(false)
  const isEdit = Boolean(project)

  // Reset the form each time the sheet opens.
  React.useEffect(() => {
    if (open) {
      setForm(initialForm(project))
      setSubmitted(false)
    }
  }, [open, project])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const nameInvalid = submitted && form.name.trim().length === 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (form.name.trim().length === 0) return

    const input: ProjectInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type,
      status: form.status,
      coverUrl: form.coverUrl,
      startDate: form.startDate,
      dueDate: form.dueDate,
      ownerId: project?.ownerId ?? currentMember.id,
    }

    if (project) {
      actions.updateProject(project.id, input)
    } else {
      const created = actions.createProject(input)
      onCreated?.(created)
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 border-l border-border bg-background p-0 sm:max-w-[30rem]">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="px-8 pt-8 pb-6">
            <SheetTitle className="text-title">
              {isEdit ? "Edit project" : "New project"}
            </SheetTitle>
            <SheetDescription>
              {isEdit
                ? "Update the details of this project."
                : "Give the work a home. You can change everything later."}
            </SheetDescription>
          </SheetHeader>

          <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-8 pb-8">
            <Field label="Project name" htmlFor="project-name">
              <Input
                id="project-name"
                autoFocus
                placeholder="e.g. Autumn Campaign"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                aria-invalid={nameInvalid || undefined}
              />
            </Field>

            <Field label="Description" htmlFor="project-description">
              <Textarea
                id="project-description"
                placeholder="What is this project about?"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className="min-h-24"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Type" htmlFor="project-type">
                <FormSelect
                  id="project-type"
                  value={form.type}
                  onValueChange={(v) => update("type", v)}
                  options={PROJECT_TYPES}
                />
              </Field>
              <Field label="Status" htmlFor="project-status">
                <FormSelect
                  id="project-status"
                  value={form.status}
                  onValueChange={(v) => update("status", v)}
                  options={PROJECT_STATUSES}
                />
              </Field>
            </div>

            <Field label="Cover image">
              <CoverPicker
                value={form.coverUrl}
                onChange={(url) => update("coverUrl", url)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Start date" htmlFor="project-start">
                <Input
                  id="project-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update("startDate", e.target.value)}
                />
              </Field>
              <Field label="Due date" htmlFor="project-due">
                <Input
                  id="project-due"
                  type="date"
                  min={form.startDate}
                  value={form.dueDate}
                  onChange={(e) => update("dueDate", e.target.value)}
                />
              </Field>
            </div>
          </div>

          <SheetFooter className="flex-row justify-end border-t border-border px-8 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{isEdit ? "Save changes" : "Create project"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function CoverPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const [custom, setCustom] = React.useState<string | null>(null)

  // Mock upload: pick a sample image that is not already a preset.
  function mockUpload() {
    const sample = UPLOAD_SAMPLES[Math.floor(Math.random() * UPLOAD_SAMPLES.length)]
    setCustom(sample.url)
    onChange(sample.url)
  }

  const options = custom
    ? [{ id: "custom", label: "Uploaded", url: custom }, ...COVER_OPTIONS]
    : COVER_OPTIONS

  return (
    <div className="grid grid-cols-4 gap-2">
      {options.map((opt) => {
        const selected = opt.url === value
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.url)}
            aria-label={opt.label}
            aria-pressed={selected}
            className={cn(
              "group/cover relative aspect-[4/3] overflow-hidden rounded-md bg-muted outline-none transition-[box-shadow,transform] duration-150",
              selected
                ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                : "ring-1 ring-foreground/5 hover:ring-foreground/25 focus-visible:ring-foreground/40"
            )}
          >
            <FadeImage
              src={opt.url}
              alt=""
              fill
              sizes="120px"
              className="object-cover transition-transform duration-300 group-hover/cover:scale-105"
            />
            {selected && (
              <span className="absolute right-1 bottom-1 flex size-4 items-center justify-center rounded-full bg-foreground text-background">
                <RiCheckLine className="size-3" />
              </span>
            )}
          </button>
        )
      })}
      <button
        type="button"
        onClick={mockUpload}
        className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground transition-colors outline-none hover:border-foreground/30 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <RiUploadCloud2Line className="size-4" />
        <span className="text-[11px]">Upload</span>
      </button>
    </div>
  )
}
