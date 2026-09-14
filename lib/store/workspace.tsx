"use client"

import * as React from "react"

import { createClient } from "@/lib/supabase/client"
import { createRepo, type Repo } from "@/lib/supabase/repo"
import type {
  ActivityEvent,
  ActivityKind,
  Asset,
  AssetInput,
  ID,
  Member,
  Project,
  ProjectInput,
  Task,
  TaskInput,
} from "@/lib/types"

/**
 * Workspace store.
 *
 * A single client-side source of truth for projects, assets, tasks and
 * activity. Components read through the hooks below and mutate through
 * `actions`; they never talk to Supabase directly.
 *
 * Two modes share the same reducer and hooks:
 *  - "live": state is hydrated from Supabase by the server layout; every
 *    action updates state optimistically, persists through `Repo`, and
 *    rolls back if the write fails.
 *  - "demo": in-memory only, seeded from the mock data in /data.
 */

export type StoreMode = "live" | "demo"

export interface WorkspaceSnapshot {
  workspaceId: string
  currentMemberId: ID
  members: Member[]
  projects: Project[]
  assets: Asset[]
  tasks: Task[]
  activity: ActivityEvent[]
}

type WorkspaceState = WorkspaceSnapshot

type Action =
  | { type: "project/create"; project: Project }
  | { type: "project/update"; id: ID; patch: Partial<Project> }
  | { type: "project/delete"; id: ID }
  | { type: "project/restore"; project: Project; assets: Asset[]; tasks: Task[]; activity: ActivityEvent[] }
  | { type: "asset/add"; asset: Asset }
  | { type: "asset/update"; id: ID; patch: Partial<Asset> }
  | { type: "asset/delete"; id: ID }
  | { type: "asset/restore"; asset: Asset }
  | { type: "task/create"; task: Task }
  | { type: "task/update"; id: ID; patch: Partial<Task> }
  | { type: "task/delete"; id: ID }
  | { type: "task/restore"; task: Task }
  | { type: "activity/log"; event: ActivityEvent }
  | { type: "activity/remove"; id: ID }

function touchProject(projects: Project[], id: ID, at: string) {
  return projects.map((p) => (p.id === id ? { ...p, updatedAt: at } : p))
}

function reducer(state: WorkspaceState, action: Action): WorkspaceState {
  switch (action.type) {
    case "project/create":
      return { ...state, projects: [action.project, ...state.projects] }
    case "project/update":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.id ? { ...p, ...action.patch } : p
        ),
      }
    case "project/delete":
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.id),
        assets: state.assets.filter((a) => a.projectId !== action.id),
        tasks: state.tasks.filter((t) => t.projectId !== action.id),
        activity: state.activity.filter((e) => e.projectId !== action.id),
      }
    case "project/restore":
      return {
        ...state,
        projects: [action.project, ...state.projects],
        assets: [...action.assets, ...state.assets],
        tasks: [...action.tasks, ...state.tasks],
        activity: [...action.activity, ...state.activity],
      }
    case "asset/add":
      return {
        ...state,
        assets: [action.asset, ...state.assets],
        projects: touchProject(state.projects, action.asset.projectId, action.asset.createdAt),
      }
    case "asset/update":
      return {
        ...state,
        assets: state.assets.map((a) =>
          a.id === action.id ? { ...a, ...action.patch } : a
        ),
      }
    case "asset/delete":
      return { ...state, assets: state.assets.filter((a) => a.id !== action.id) }
    case "asset/restore":
      return { ...state, assets: [action.asset, ...state.assets] }
    case "task/create":
      return {
        ...state,
        tasks: [action.task, ...state.tasks],
        projects: touchProject(state.projects, action.task.projectId, action.task.createdAt),
      }
    case "task/update":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, ...action.patch } : t
        ),
      }
    case "task/delete":
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) }
    case "task/restore":
      return { ...state, tasks: [action.task, ...state.tasks] }
    case "activity/log":
      return { ...state, activity: [action.event, ...state.activity] }
    case "activity/remove":
      return { ...state, activity: state.activity.filter((e) => e.id !== action.id) }
  }
}

export interface WorkspaceActions {
  createProject: (input: ProjectInput) => Project
  updateProject: (id: ID, patch: Partial<ProjectInput>) => void
  deleteProject: (id: ID) => void
  addAsset: (input: AssetInput) => Asset
  updateAsset: (id: ID, patch: Partial<AssetInput>) => void
  deleteAsset: (id: ID) => void
  createTask: (input: TaskInput) => Task
  updateTask: (id: ID, patch: Partial<TaskInput>) => void
  deleteTask: (id: ID) => void
}

interface WorkspaceContextValue {
  state: WorkspaceState
  actions: WorkspaceActions
  mode: StoreMode
  /** Route prefix for this store's pages: "" for live, "/demo" for demo. */
  basePath: string
  /** Last persistence error, for surfacing in the UI. */
  error: string | null
  clearError: () => void
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null)

export function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

interface WorkspaceProviderProps {
  children: React.ReactNode
  initialState: WorkspaceSnapshot
  mode: StoreMode
  basePath?: string
}

export function WorkspaceProvider({
  children,
  initialState,
  mode,
  basePath = "",
}: WorkspaceProviderProps) {
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const [error, setError] = React.useState<string | null>(null)
  const stateRef = React.useRef(state)
  stateRef.current = state

  const repoRef = React.useRef<Repo | null>(null)
  if (mode === "live" && repoRef.current === null) {
    repoRef.current = createRepo(createClient(), initialState.workspaceId)
  }

  const actions = React.useMemo<WorkspaceActions>(() => {
    const now = () => new Date().toISOString()
    const repo = repoRef.current

    /** Runs a write in live mode; on failure applies `rollback` and records the error. */
    const persist = (write: (repo: Repo) => Promise<unknown>, rollback: () => void) => {
      if (!repo) return
      write(repo).catch((err: unknown) => {
        console.error("[workspace] write failed", err)
        rollback()
        setError(err instanceof Error ? err.message : "Something went wrong while saving.")
      })
    }

    const log = (
      projectId: ID,
      kind: ActivityKind,
      target: string,
      detail?: string,
      actorId: ID | undefined = stateRef.current.currentMemberId
    ) => {
      const event: ActivityEvent = {
        id: newId(),
        projectId,
        kind,
        actorId,
        target,
        detail,
        createdAt: now(),
      }
      dispatch({ type: "activity/log", event })
      persist(
        (r) => r.insertActivity(event),
        () => dispatch({ type: "activity/remove", id: event.id })
      )
    }

    return {
      createProject(input) {
        const at = now()
        const project: Project = { ...input, id: newId(), createdAt: at, updatedAt: at }
        dispatch({ type: "project/create", project })
        persist(
          (r) => r.insertProject(project),
          () => dispatch({ type: "project/delete", id: project.id })
        )
        log(project.id, "project.created", project.name)
        return project
      },
      updateProject(id, patch) {
        const prev = stateRef.current.projects.find((p) => p.id === id)
        if (!prev) return
        const full = { ...patch, updatedAt: now() }
        dispatch({ type: "project/update", id, patch: full })
        persist(
          (r) => r.updateProject(id, full),
          () => dispatch({ type: "project/update", id, patch: prev })
        )
        if (patch.status && patch.status !== prev.status) {
          log(id, "project.status", patch.name ?? prev.name, patch.status, undefined)
        }
      },
      deleteProject(id) {
        const s = stateRef.current
        const project = s.projects.find((p) => p.id === id)
        if (!project) return
        const assets = s.assets.filter((a) => a.projectId === id)
        const tasks = s.tasks.filter((t) => t.projectId === id)
        const activity = s.activity.filter((e) => e.projectId === id)
        dispatch({ type: "project/delete", id })
        persist(
          (r) => r.deleteProject(id, assets),
          () => dispatch({ type: "project/restore", project, assets, tasks, activity })
        )
      },

      addAsset(input) {
        const at = now()
        const asset: Asset = { ...input, id: newId(), createdAt: at, updatedAt: at }
        dispatch({ type: "asset/add", asset })
        persist(
          (r) => r.insertAsset(asset),
          () => dispatch({ type: "asset/delete", id: asset.id })
        )
        log(asset.projectId, "asset.uploaded", asset.name)
        return asset
      },
      updateAsset(id, patch) {
        const prev = stateRef.current.assets.find((a) => a.id === id)
        if (!prev) return
        const full = { ...patch, updatedAt: now() }
        dispatch({ type: "asset/update", id, patch: full })
        persist(
          (r) => r.updateAsset(id, full),
          () => dispatch({ type: "asset/update", id, patch: prev })
        )
      },
      deleteAsset(id) {
        const asset = stateRef.current.assets.find((a) => a.id === id)
        if (!asset) return
        dispatch({ type: "asset/delete", id })
        persist(
          (r) => r.deleteAsset(asset),
          () => dispatch({ type: "asset/restore", asset })
        )
        log(asset.projectId, "asset.deleted", asset.name)
      },

      createTask(input) {
        const at = now()
        const task: Task = { ...input, id: newId(), createdAt: at, updatedAt: at }
        dispatch({ type: "task/create", task })
        persist(
          (r) => r.insertTask(task),
          () => dispatch({ type: "task/delete", id: task.id })
        )
        log(task.projectId, "task.created", task.title)
        return task
      },
      updateTask(id, patch) {
        const prev = stateRef.current.tasks.find((t) => t.id === id)
        if (!prev) return
        const full = { ...patch, updatedAt: now() }
        dispatch({ type: "task/update", id, patch: full })
        persist(
          (r) => r.updateTask(id, full),
          () => dispatch({ type: "task/update", id, patch: prev })
        )
        if (patch.status && patch.status !== prev.status) {
          const title = patch.title ?? prev.title
          if (patch.status === "done") log(prev.projectId, "task.completed", title)
          else log(prev.projectId, "task.status", title, patch.status)
        }
      },
      deleteTask(id) {
        const task = stateRef.current.tasks.find((t) => t.id === id)
        if (!task) return
        dispatch({ type: "task/delete", id })
        persist(
          (r) => r.deleteTask(id),
          () => dispatch({ type: "task/restore", task })
        )
        log(task.projectId, "task.deleted", task.title)
      },
    }
  }, [])

  const clearError = React.useCallback(() => setError(null), [])

  const value = React.useMemo(
    () => ({ state, actions, mode, basePath, error, clearError }),
    [state, actions, mode, basePath, error, clearError]
  )

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = React.useContext(WorkspaceContext)
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider")
  return ctx
}

/* ------------------------------------------------------------------------ */
/* Selectors                                                                */
/* ------------------------------------------------------------------------ */

/** Route prefix for links inside this store ("" or "/demo"). */
export function useBasePath() {
  return useWorkspace().basePath
}

export function useStoreMode() {
  return useWorkspace().mode
}

export function useWorkspaceId() {
  return useWorkspace().state.workspaceId
}

export function useProjects() {
  return useWorkspace().state.projects
}

export function useProject(id: ID) {
  const { projects } = useWorkspace().state
  return React.useMemo(() => projects.find((p) => p.id === id), [projects, id])
}

export function useAssets(projectId?: ID) {
  const { assets } = useWorkspace().state
  return React.useMemo(
    () => (projectId ? assets.filter((a) => a.projectId === projectId) : assets),
    [assets, projectId]
  )
}

export function useAsset(id: ID | null | undefined) {
  const { assets } = useWorkspace().state
  return React.useMemo(() => (id ? assets.find((a) => a.id === id) : undefined), [assets, id])
}

export function useTasks(projectId?: ID) {
  const { tasks } = useWorkspace().state
  return React.useMemo(
    () => (projectId ? tasks.filter((t) => t.projectId === projectId) : tasks),
    [tasks, projectId]
  )
}

export function useActivity(projectId?: ID) {
  const { activity } = useWorkspace().state
  return React.useMemo(() => {
    const list = projectId ? activity.filter((e) => e.projectId === projectId) : activity
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [activity, projectId])
}

export function useMembers() {
  return useWorkspace().state.members
}

export function useMember(id?: ID) {
  const { members } = useWorkspace().state
  return React.useMemo(() => (id ? members.find((m) => m.id === id) : undefined), [members, id])
}

export function useCurrentMember(): Member {
  const { members, currentMemberId } = useWorkspace().state
  return (
    members.find((m) => m.id === currentMemberId) ?? {
      id: currentMemberId,
      name: "You",
      role: "Member",
      initials: "?",
    }
  )
}

export interface ProjectStats {
  assetCount: number
  taskCount: number
  doneCount: number
  openCount: number
  /** 0–100 */
  progress: number
}

export function computeProjectStats(projectId: ID, assets: Asset[], tasks: Task[]): ProjectStats {
  const projectTasks = tasks.filter((t) => t.projectId === projectId)
  const doneCount = projectTasks.filter((t) => t.status === "done").length
  const taskCount = projectTasks.length
  return {
    assetCount: assets.filter((a) => a.projectId === projectId).length,
    taskCount,
    doneCount,
    openCount: taskCount - doneCount,
    progress: taskCount === 0 ? 0 : Math.round((doneCount / taskCount) * 100),
  }
}

export function useProjectStats(projectId: ID): ProjectStats {
  const { assets, tasks } = useWorkspace().state
  return React.useMemo(() => computeProjectStats(projectId, assets, tasks), [projectId, assets, tasks])
}
