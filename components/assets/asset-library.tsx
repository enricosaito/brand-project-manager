"use client"

import * as React from "react"
import { RiImage2Line, RiUploadLine } from "@remixicon/react"

import { EmptyState } from "@/components/app/empty-state"
import { FilterSelect } from "@/components/app/filter-select"
import { SearchInput } from "@/components/app/search-input"
import { AssetGrid } from "@/components/assets/asset-grid"
import { AssetPreview } from "@/components/assets/asset-preview"
import { AssetUpload } from "@/components/assets/asset-upload"
import { Button } from "@/components/ui/button"
import { ASSET_TYPES } from "@/lib/labels"
import { useAsset, useAssets, useProjects } from "@/lib/store/workspace"
import type { Asset, AssetType } from "@/lib/types"

type TypeFilter = AssetType | "all"
type DateFilter = "any" | "7d" | "30d" | "90d"
type SortKey = "added" | "updated" | "name"

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
]

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "added", label: "Recently added" },
  { value: "updated", label: "Recently updated" },
  { value: "name", label: "Name" },
]

interface AssetLibraryProps {
  /** Scope to a single project. Omit for the global library. */
  projectId?: string
}

/**
 * The one asset browsing surface, used both inside a project and for the
 * global library. Filters adapt to scope; the visual system stays identical.
 */
export function AssetLibrary({ projectId }: AssetLibraryProps) {
  const allAssets = useAssets(projectId)
  const projects = useProjects()
  const isGlobal = !projectId

  const [query, setQuery] = React.useState("")
  const [type, setType] = React.useState<TypeFilter>("all")
  const [project, setProject] = React.useState<string>("all")
  const [date, setDate] = React.useState<DateFilter>("any")
  const [sort, setSort] = React.useState<SortKey>("added")
  const [previewId, setPreviewId] = React.useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = React.useState(false)

  const previewAsset = useAsset(previewId) ?? null

  const projectNames = React.useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    [projects]
  )

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const cutoff =
      date === "any"
        ? null
        : Date.now() - { "7d": 7, "30d": 30, "90d": 90 }[date] * 86_400_000

    const list = allAssets.filter((a) => {
      if (type !== "all" && a.type !== type) return false
      if (project !== "all" && a.projectId !== project) return false
      if (cutoff && new Date(a.createdAt).getTime() < cutoff) return false
      if (
        q &&
        !`${a.name} ${a.tags.join(" ")} ${a.extension}`.toLowerCase().includes(q)
      )
        return false
      return true
    })

    return list.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name)
        case "updated":
          return b.updatedAt.localeCompare(a.updatedAt)
        default:
          return b.createdAt.localeCompare(a.createdAt)
      }
    })
  }, [allAssets, query, type, project, date, sort])

  const hasFilters =
    query.trim() !== "" || type !== "all" || project !== "all" || date !== "any"

  function clearFilters() {
    setQuery("")
    setType("all")
    setProject("all")
    setDate("any")
  }

  const uploadButton = (
    <Button onClick={() => setUploadOpen(true)}>
      <RiUploadLine data-icon="inline-start" />
      Upload
    </Button>
  )

  return (
    <div>
      {allAssets.length > 0 && (
        <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search assets"
              className="w-full sm:w-72"
            />
            <div className="flex flex-wrap items-center gap-1">
              <FilterSelect
                value={type}
                onValueChange={setType}
                defaultValue="all"
                options={[{ value: "all", label: "All types" }, ...ASSET_TYPES]}
              />
              {isGlobal && (
                <FilterSelect
                  value={project}
                  onValueChange={setProject}
                  defaultValue="all"
                  options={[
                    { value: "all", label: "All projects" },
                    ...projects.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                />
              )}
              <FilterSelect
                value={date}
                onValueChange={setDate}
                defaultValue="any"
                options={DATE_OPTIONS}
              />
              <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
              <FilterSelect
                value={sort}
                onValueChange={setSort}
                options={SORT_OPTIONS}
                prefix="Sort"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <span className="text-xs text-muted-foreground tabular-nums">
              {filtered.length} of {allAssets.length}
            </span>
            {uploadButton}
          </div>
        </div>
      )}

      <div className={allAssets.length > 0 ? "mt-7" : undefined}>
        {allAssets.length === 0 ? (
          <EmptyState
            icon={<RiImage2Line />}
            title="No assets"
            description="Your brand assets will appear here. Upload imagery, documents and design files to get started."
            action={uploadButton}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            size="section"
            title="No assets match"
            description="Try a different search or clear the filters."
            action={
              hasFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <AssetGrid
            assets={filtered}
            onOpen={(a) => setPreviewId(a.id)}
            projectNames={isGlobal ? projectNames : undefined}
          />
        )}
      </div>

      <AssetPreview
        asset={previewAsset}
        assets={filtered}
        onOpenChange={(open) => !open && setPreviewId(null)}
        onNavigate={(a: Asset) => setPreviewId(a.id)}
        showProject={isGlobal}
      />
      <AssetUpload open={uploadOpen} onOpenChange={setUploadOpen} projectId={projectId} />
    </div>
  )
}
