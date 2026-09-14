"use client"

import * as React from "react"
import { RiAddLine, RiFolder3Line, RiLoader4Line } from "@remixicon/react"

import { seedSampleData } from "@/app/(app)/workspace-actions"
import { PageContainer } from "@/components/app/app-shell"
import { EmptyState } from "@/components/app/empty-state"
import { FilterSelect } from "@/components/app/filter-select"
import { PageHeader } from "@/components/app/page-header"
import { SearchInput } from "@/components/app/search-input"
import { ProjectGrid } from "@/components/projects/project-grid"
import { ProjectSheet } from "@/components/projects/project-sheet"
import { Button } from "@/components/ui/button"
import { PROJECT_STATUSES, PROJECT_TYPES } from "@/lib/labels"
import { useProjects, useStoreMode, useWorkspaceId } from "@/lib/store/workspace"
import type { ProjectStatus, ProjectType } from "@/lib/types"

type StatusFilter = ProjectStatus | "all"
type TypeFilter = ProjectType | "all"
type SortKey = "updated" | "created" | "name" | "due"

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "updated", label: "Recently updated" },
  { value: "created", label: "Recently created" },
  { value: "due", label: "Due date" },
  { value: "name", label: "Name" },
]

export function ProjectsPage() {
  const projects = useProjects()
  const mode = useStoreMode()
  const workspaceId = useWorkspaceId()
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState<StatusFilter>("all")
  const [type, setType] = React.useState<TypeFilter>("all")
  const [sort, setSort] = React.useState<SortKey>("updated")
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [seeding, startSeeding] = React.useTransition()
  const [seedError, setSeedError] = React.useState<string | null>(null)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = projects.filter((p) => {
      if (status !== "all" && p.status !== status) return false
      if (type !== "all" && p.type !== type) return false
      if (q && !`${p.name} ${p.description}`.toLowerCase().includes(q)) return false
      return true
    })
    return list.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name)
        case "created":
          return b.createdAt.localeCompare(a.createdAt)
        case "due":
          return a.dueDate.localeCompare(b.dueDate)
        default:
          return b.updatedAt.localeCompare(a.updatedAt)
      }
    })
  }, [projects, query, status, type, sort])

  const hasFilters = query.trim() !== "" || status !== "all" || type !== "all"

  function importSample() {
    setSeedError(null)
    startSeeding(async () => {
      const result = await seedSampleData(workspaceId)
      if (result?.error) setSeedError(result.error)
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        description="Everything your brand team is working on."
        actions={
          <Button onClick={() => setSheetOpen(true)}>
            <RiAddLine data-icon="inline-start" />
            New project
          </Button>
        }
      />

      {projects.length > 0 && (
        <div className="mt-8 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search projects"
            className="w-full sm:w-72"
          />
          <div className="flex flex-wrap items-center gap-1">
            <FilterSelect
              value={status}
              onValueChange={setStatus}
              defaultValue="all"
              options={[{ value: "all", label: "All statuses" }, ...PROJECT_STATUSES]}
            />
            <FilterSelect
              value={type}
              onValueChange={setType}
              defaultValue="all"
              options={[{ value: "all", label: "All types" }, ...PROJECT_TYPES]}
            />
            <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
            <FilterSelect
              value={sort}
              onValueChange={setSort}
              options={SORT_OPTIONS}
              prefix="Sort"
              align="end"
            />
          </div>
        </div>
      )}

      <div className="mt-8">
        {projects.length === 0 ? (
          <EmptyState
            icon={<RiFolder3Line />}
            title="No projects yet"
            description="No projects have been created yet. Start with the work your team is focused on right now."
            action={
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button onClick={() => setSheetOpen(true)}>
                    <RiAddLine data-icon="inline-start" />
                    Create project
                  </Button>
                  {mode === "live" && (
                    <Button variant="outline" onClick={importSample} disabled={seeding}>
                      {seeding && <RiLoader4Line className="animate-spin" data-icon="inline-start" />}
                      Import sample data
                    </Button>
                  )}
                </div>
                {seedError && <p className="text-xs text-destructive">{seedError}</p>}
              </div>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            size="section"
            title="No projects match"
            description="Try a different search or clear the filters."
            action={
              hasFilters && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("")
                    setStatus("all")
                    setType("all")
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <ProjectGrid projects={filtered} />
        )}
      </div>

      <ProjectSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </PageContainer>
  )
}
