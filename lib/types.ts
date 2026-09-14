/**
 * Core domain entities for the Brand Workspace.
 *
 * These types describe the shape of data the UI consumes. Today they are
 * backed by in-memory mock data (see `/data`); later they can be backed by an
 * API without changing the components that render them.
 */

export type ID = string

export type ProjectType =
  | "brand"
  | "campaign"
  | "website"
  | "social"
  | "packaging"
  | "print"
  | "internal"
  | "other"

export type ProjectStatus = "planning" | "in-progress" | "review" | "completed"

export interface Member {
  id: ID
  name: string
  role: string
  /** Two-letter initials used for avatars. */
  initials: string
}

export interface Project {
  id: ID
  name: string
  description: string
  type: ProjectType
  status: ProjectStatus
  coverUrl: string
  ownerId: ID
  /** ISO date (YYYY-MM-DD). */
  startDate: string
  /** ISO date (YYYY-MM-DD). */
  dueDate: string
  /** ISO datetime. */
  createdAt: string
  /** ISO datetime. */
  updatedAt: string
}

export type AssetType = "image" | "video" | "document" | "design" | "presentation"

export interface Asset {
  id: ID
  projectId: ID
  name: string
  type: AssetType
  /** File extension without the dot, e.g. "png", "pdf", "fig". */
  extension: string
  /** Visual preview. Present for images and videos; optional otherwise. */
  previewUrl?: string
  width?: number
  height?: number
  /** Duration in seconds, for videos. */
  duration?: number
  /** Size in bytes. */
  size: number
  uploadedById: ID
  createdAt: string
  updatedAt: string
  tags: string[]
  description?: string
}

export type TaskStatus = "todo" | "in-progress" | "review" | "done"
export type TaskPriority = "low" | "medium" | "high"

export interface Task {
  id: ID
  projectId: ID
  title: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId?: ID
  /** ISO date (YYYY-MM-DD). */
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export type ActivityKind =
  | "project.created"
  | "project.status"
  | "asset.uploaded"
  | "assets.added"
  | "asset.deleted"
  | "task.created"
  | "task.status"
  | "task.completed"
  | "task.deleted"

export interface ActivityEvent {
  id: ID
  projectId: ID
  kind: ActivityKind
  /** Member who performed the action. Omitted for system events. */
  actorId?: ID
  /** Human readable subject, e.g. the file name or task title. */
  target: string
  /** Optional qualifier, e.g. the new status. */
  detail?: string
  createdAt: string
}

/** Input shapes for create/update operations. */
export type ProjectInput = Omit<Project, "id" | "createdAt" | "updatedAt">
export type AssetInput = Omit<Asset, "id" | "createdAt" | "updatedAt">
export type TaskInput = Omit<Task, "id" | "createdAt" | "updatedAt">
