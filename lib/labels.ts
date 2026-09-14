import type {
  AssetType,
  ProjectStatus,
  ProjectType,
  TaskPriority,
  TaskStatus,
} from "@/lib/types"

/**
 * Display labels and semantic color classes for enum-like fields.
 * Colors are intentionally restrained: a single dot or tint, never a loud badge.
 */

export const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: "brand", label: "Brand" },
  { value: "campaign", label: "Campaign" },
  { value: "website", label: "Website" },
  { value: "social", label: "Social" },
  { value: "packaging", label: "Packaging" },
  { value: "print", label: "Print" },
  { value: "internal", label: "Internal" },
  { value: "other", label: "Other" },
]

export const PROJECT_STATUSES: {
  value: ProjectStatus
  label: string
  dot: string
}[] = [
  { value: "planning", label: "Planning", dot: "bg-muted-foreground/50" },
  { value: "in-progress", label: "In progress", dot: "bg-brand" },
  { value: "review", label: "In review", dot: "bg-warning" },
  { value: "completed", label: "Completed", dot: "bg-success" },
]

export const TASK_STATUSES: {
  value: TaskStatus
  label: string
  dot: string
}[] = [
  { value: "todo", label: "Todo", dot: "bg-muted-foreground/40" },
  { value: "in-progress", label: "In progress", dot: "bg-brand" },
  { value: "review", label: "Review", dot: "bg-warning" },
  { value: "done", label: "Done", dot: "bg-success" },
]

export const TASK_PRIORITIES: {
  value: TaskPriority
  label: string
  className: string
}[] = [
  { value: "low", label: "Low", className: "text-muted-foreground" },
  { value: "medium", label: "Medium", className: "text-warning" },
  { value: "high", label: "High", className: "text-destructive" },
]

export const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "document", label: "Documents" },
  { value: "design", label: "Design files" },
  { value: "presentation", label: "Presentations" },
]

export function projectTypeLabel(type: ProjectType) {
  return PROJECT_TYPES.find((t) => t.value === type)?.label ?? type
}

export function projectStatusMeta(status: ProjectStatus) {
  return PROJECT_STATUSES.find((s) => s.value === status) ?? PROJECT_STATUSES[0]
}

export function taskStatusMeta(status: TaskStatus) {
  return TASK_STATUSES.find((s) => s.value === status) ?? TASK_STATUSES[0]
}

export function taskPriorityMeta(priority: TaskPriority) {
  return (
    TASK_PRIORITIES.find((p) => p.value === priority) ?? TASK_PRIORITIES[0]
  )
}

export function assetTypeLabel(type: AssetType) {
  switch (type) {
    case "image":
      return "Image"
    case "video":
      return "Video"
    case "document":
      return "Document"
    case "design":
      return "Design file"
    case "presentation":
      return "Presentation"
  }
}
