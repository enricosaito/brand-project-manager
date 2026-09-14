"use client"

import * as React from "react"

import * as mock from "@/data"
import { createId } from "@/lib/format"
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
 * activity. Components never touch mock data directly; they read through the
 * hooks below and mutate through `actions`. Swapping this for an API-backed
 * implementation (React Query, server actions, etc.) only changes this file.
 */

interface WorkspaceState {
  projects: Project[]
  assets: Asset[]
  tasks: Task[]
  activity: ActivityEvent[]
  members: Member[]
  currentMemberId: ID
}

type Action =
  | { type: "project/create"; project: Project }
  | { type: "project/update"; id: ID; patch: Partial<Project> }
  | { type: "project/delete"; id: ID }
  | { type: "asset/add"; asset: Asset }
  | { type: "asset/update"; id: ID; patch: Partial<Asset> }
  | { type: "asset/delete"; id: ID }
  | { type: "task/create"; task: Task }
  | { type: "task/update"; id: ID; patch: Partial<Task> }
  | { type: "task/delete"; id: ID }
  | { type: "activity/log"; event: ActivityEvent }

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
    case "asset/add":
      return {
        ...state,
        assets: [action.asset, ...state.assets],
        projects: touchProject(
          state.projects,
          action.asset.projectId,
          action.asset.createdAt
        ),
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
    case "task/create":
      return {
        ...state,
        tasks: [action.task, ...state.tasks],
        projects: touchProject(
          state.projects,
          action.task.projectId,
          action.task.createdAt
        ),
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
    case "activity/log":
      return { ...state, activity: [action.event, ...state.activity] }
  }
}

const initialState: WorkspaceState = {
  projects: mock.projects,
  assets: mock.assets,
  tasks: mock.tasks,
  activity: mock.activity,
  members: mock.members,
  currentMemberId: mock.CURRENT_MEMBER_ID,
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
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const stateRef = React.useRef(state)
  stateRef.current = state

  const actions = React.useMemo<WorkspaceActions>(() => {
    const now = () => new Date().toISOString()

    const log = (
      projectId: ID,
      kind: ActivityKind,
      target: string,
      detail?: string,
      actorId: ID | undefined = stateRef.current.currentMemberId
    ) => {
      dispatch({
        type: "activity/log",
        event: {
          id: createId("ev"),
          projectId,
          kind,
          actorId,
          target,
          detail,
          createdAt: now(),
        },
      })
    }

    return {
      createProject(input) {
        const at = now()
        const project: Project = {
          ...input,
          id: createId("p"),
          createdAt: at,
          updatedAt: at,
        }
        dispatch({ type: "project/create", project })
        log(project.id, "project.created", project.name)
        return project
      },
      updateProject(id, patch) {
        const prev = stateRef.current.projects.find((p) => p.id === id)
        dispatch({
          type: "project/update",
          id,
          patch: { ...patch, updatedAt: now() },
        })
        if (prev && patch.status && patch.status !== prev.status) {
          log(id, "project.status", patch.name ?? prev.name, patch.status, undefined)
        }
      },
      deleteProject(id) {
        dispatch({ type: "project/delete", id })
      },
      addAsset(input) {
        const at = now()
        const asset: Asset = {
          ...input,
          id: createId("a"),
          createdAt: at,
          updatedAt: at,
        }
        dispatch({ type: "asset/add", asset })
        log(asset.projectId, "asset.uploaded", asset.name)
        return asset
      },
      updateAsset(id, patch) {
        dispatch({ type: "asset/update", id, patch: { ...patch, updatedAt: now() } })
      },
      deleteAsset(id) {
        const asset = stateRef.current.assets.find((a) => a.id === id)
        dispatch({ type: "asset/delete", id })
        if (asset) log(asset.projectId, "asset.deleted", asset.name)
      },
      createTask(input) {
        const at = now()
        const task: Task = {
          ...input,
          id: createId("t"),
          createdAt: at,
          updatedAt: at,
        }
        dispatch({ type: "task/create", task })
        log(task.projectId, "task.created", task.title)
        return task
      },
      updateTask(id, patch) {
        const prev = stateRef.current.tasks.find((t) => t.id === id)
        dispatch({ type: "task/update", id, patch: { ...patch, updatedAt: now() } })
        if (prev && patch.status && patch.status !== prev.status) {
          const title = patch.title ?? prev.title
          if (patch.status === "done") {
            log(prev.projectId, "task.completed", title)
          } else {
            log(prev.projectId, "task.status", title, patch.status)
          }
        }
      },
      deleteTask(id) {
        const task = stateRef.current.tasks.find((t) => t.id === id)
        dispatch({ type: "task/delete", id })
        if (task) log(task.projectId, "task.deleted", task.title)
      },
    }
  }, [])

  const value = React.useMemo(() => ({ state, actions }), [state, actions])

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = React.useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return ctx
}

/* ------------------------------------------------------------------------ */
/* Selectors                                                                */
/* ------------------------------------------------------------------------ */

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
  return React.useMemo(
    () => (id ? assets.find((a) => a.id === id) : undefined),
    [assets, id]
  )
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
    const list = projectId
      ? activity.filter((e) => e.projectId === projectId)
      : activity
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [activity, projectId])
}

export function useMembers() {
  return useWorkspace().state.members
}

export function useMember(id?: ID) {
  const { members } = useWorkspace().state
  return React.useMemo(
    () => (id ? members.find((m) => m.id === id) : undefined),
    [members, id]
  )
}

export function useCurrentMember() {
  const { members, currentMemberId } = useWorkspace().state
  return members.find((m) => m.id === currentMemberId) ?? members[0]
}

export interface ProjectStats {
  assetCount: number
  taskCount: number
  doneCount: number
  openCount: number
  /** 0–100 */
  progress: number
}

export function computeProjectStats(
  projectId: ID,
  assets: Asset[],
  tasks: Task[]
): ProjectStats {
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
  return React.useMemo(
    () => computeProjectStats(projectId, assets, tasks),
    [projectId, assets, tasks]
  )
}
