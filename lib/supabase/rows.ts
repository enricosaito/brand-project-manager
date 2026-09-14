import type {
  ActivityEvent,
  ActivityKind,
  Asset,
  AssetType,
  Member,
  Project,
  ProjectStatus,
  ProjectType,
  Task,
  TaskPriority,
  TaskStatus,
  Workspace,
} from "@/lib/types"

/**
 * Database row shapes (snake_case) and mappers to the UI entities in
 * lib/types.ts. Keeping the translation here means the rest of the app never
 * sees column names.
 */

export interface ProfileRow {
  id: string
  full_name: string
  avatar_url: string | null
}

export interface WorkspaceRow {
  id: string
  name: string
  color: string
}

export interface MemberRow {
  workspace_id: string
  user_id: string
  role: "owner" | "admin" | "member"
  profiles: ProfileRow | null
}

export interface ProjectRow {
  id: string
  workspace_id: string
  name: string
  description: string
  type: ProjectType
  status: ProjectStatus
  cover_url: string | null
  owner_id: string | null
  start_date: string | null
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface AssetRow {
  id: string
  workspace_id: string
  project_id: string
  name: string
  type: AssetType
  extension: string
  storage_path: string | null
  preview_url: string | null
  width: number | null
  height: number | null
  duration: number | null
  size: number
  uploaded_by: string | null
  tags: string[]
  description: string | null
  created_at: string
  updated_at: string
}

export interface TaskRow {
  id: string
  workspace_id: string
  project_id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  assignee_id: string | null
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface ActivityRow {
  id: string
  workspace_id: string
  project_id: string
  kind: ActivityKind
  actor_id: string | null
  target: string
  detail: string | null
  created_at: string
}

const ROLE_LABEL = { owner: "Owner", admin: "Admin", member: "Member" } as const

export function initialsOf(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function workspaceFromRow(row: WorkspaceRow): Workspace {
  return { id: row.id, name: row.name, color: row.color, initials: initialsOf(row.name) }
}

export function memberFromRow(row: MemberRow): Member {
  const name = row.profiles?.full_name?.trim() || "Unknown"
  return {
    id: row.user_id,
    name,
    role: ROLE_LABEL[row.role],
    initials: initialsOf(name),
  }
}

export function projectFromRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    status: row.status,
    coverUrl: row.cover_url ?? "",
    ownerId: row.owner_id ?? "",
    startDate: row.start_date ?? "",
    dueDate: row.due_date ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function projectToRow(project: Project, workspaceId: string): ProjectRow {
  return {
    id: project.id,
    workspace_id: workspaceId,
    name: project.name,
    description: project.description,
    type: project.type,
    status: project.status,
    cover_url: project.coverUrl || null,
    owner_id: project.ownerId || null,
    start_date: project.startDate || null,
    due_date: project.dueDate || null,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  }
}

export function projectPatchToRow(patch: Partial<Project>): Partial<ProjectRow> {
  const row: Partial<ProjectRow> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.description !== undefined) row.description = patch.description
  if (patch.type !== undefined) row.type = patch.type
  if (patch.status !== undefined) row.status = patch.status
  if (patch.coverUrl !== undefined) row.cover_url = patch.coverUrl || null
  if (patch.ownerId !== undefined) row.owner_id = patch.ownerId || null
  if (patch.startDate !== undefined) row.start_date = patch.startDate || null
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate || null
  return row
}

export function assetFromRow(row: AssetRow): Asset {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    type: row.type,
    extension: row.extension,
    previewUrl: row.preview_url ?? undefined,
    storagePath: row.storage_path ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    duration: row.duration ?? undefined,
    size: Number(row.size),
    uploadedById: row.uploaded_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags ?? [],
    description: row.description ?? undefined,
  }
}

export function assetToRow(asset: Asset, workspaceId: string): AssetRow {
  return {
    id: asset.id,
    workspace_id: workspaceId,
    project_id: asset.projectId,
    name: asset.name,
    type: asset.type,
    extension: asset.extension,
    storage_path: asset.storagePath ?? null,
    preview_url: asset.previewUrl ?? null,
    width: asset.width ?? null,
    height: asset.height ?? null,
    duration: asset.duration ?? null,
    size: Math.round(asset.size),
    uploaded_by: asset.uploadedById || null,
    tags: asset.tags,
    description: asset.description ?? null,
    created_at: asset.createdAt,
    updated_at: asset.updatedAt,
  }
}

export function assetPatchToRow(patch: Partial<Asset>): Partial<AssetRow> {
  const row: Partial<AssetRow> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.tags !== undefined) row.tags = patch.tags
  if (patch.description !== undefined) row.description = patch.description ?? null
  if (patch.previewUrl !== undefined) row.preview_url = patch.previewUrl ?? null
  if (patch.projectId !== undefined) row.project_id = patch.projectId
  return row
}

export function taskFromRow(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    assigneeId: row.assignee_id ?? undefined,
    dueDate: row.due_date ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function taskToRow(task: Task, workspaceId: string): TaskRow {
  return {
    id: task.id,
    workspace_id: workspaceId,
    project_id: task.projectId,
    title: task.title,
    status: task.status,
    priority: task.priority,
    assignee_id: task.assigneeId ?? null,
    due_date: task.dueDate ?? null,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  }
}

export function taskPatchToRow(patch: Partial<Task>): Partial<TaskRow> {
  const row: Partial<TaskRow> = {}
  if (patch.title !== undefined) row.title = patch.title
  if (patch.status !== undefined) row.status = patch.status
  if (patch.priority !== undefined) row.priority = patch.priority
  if (patch.assigneeId !== undefined) row.assignee_id = patch.assigneeId ?? null
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate ?? null
  if (patch.projectId !== undefined) row.project_id = patch.projectId
  return row
}

export function activityFromRow(row: ActivityRow): ActivityEvent {
  return {
    id: row.id,
    projectId: row.project_id,
    kind: row.kind,
    actorId: row.actor_id ?? undefined,
    target: row.target,
    detail: row.detail ?? undefined,
    createdAt: row.created_at,
  }
}

export function activityToRow(event: ActivityEvent, workspaceId: string): ActivityRow {
  return {
    id: event.id,
    workspace_id: workspaceId,
    project_id: event.projectId,
    kind: event.kind,
    actor_id: event.actorId ?? null,
    target: event.target,
    detail: event.detail ?? null,
    created_at: event.createdAt,
  }
}
