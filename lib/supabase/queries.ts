import "server-only"

import { cache } from "react"
import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"

import type { WorkspaceSnapshot } from "@/lib/store/workspace"
import type { Workspace } from "@/lib/types"

import {
  activityFromRow,
  assetFromRow,
  memberFromRow,
  projectFromRow,
  taskFromRow,
  workspaceFromRow,
  type ActivityRow,
  type AssetRow,
  type MemberRow,
  type ProjectRow,
  type TaskRow,
  type WorkspaceRow,
} from "./rows"
import { createClient } from "./server"

export const WORKSPACE_COOKIE = "marcados-workspace"

/** All workspaces the current user belongs to. */
export async function listWorkspaces(supabase: SupabaseClient): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces ( id, name, color )")
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data ?? [])
    .map((row) => row.workspaces as unknown as WorkspaceRow | null)
    .filter((ws): ws is WorkspaceRow => Boolean(ws))
    .map(workspaceFromRow)
}

/**
 * Resolves the workspaces for the signed-in user and which one is active.
 * Creates a personal workspace on first visit so the app never has to
 * render an "empty account" state. Cached per request.
 */
export const getWorkspaceContext = cache(async (displayName: string) => {
  const supabase = await createClient()
  let workspaces = await listWorkspaces(supabase)

  if (workspaces.length === 0) {
    const first = displayName.split(" ")[0] || "My"
    const { data, error } = await supabase.rpc("create_workspace", {
      ws_name: `${first}'s workspace`,
    })
    if (error) throw error
    workspaces = [workspaceFromRow(data as WorkspaceRow)]
  }

  const cookieStore = await cookies()
  const preferred = cookieStore.get(WORKSPACE_COOKIE)?.value
  const current = workspaces.find((w) => w.id === preferred) ?? workspaces[0]

  return { supabase, workspaces, current }
})

/** Everything the client store needs for one workspace. */
export async function loadWorkspaceSnapshot(
  supabase: SupabaseClient,
  workspace: Workspace,
  currentMemberId: string
): Promise<WorkspaceSnapshot> {
  const [members, projects, assets, tasks, activity] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("workspace_id, user_id, role, profiles ( id, full_name, avatar_url )")
      .eq("workspace_id", workspace.id),
    supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("assets")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("activity_events")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(300),
  ])

  const firstError =
    members.error ?? projects.error ?? assets.error ?? tasks.error ?? activity.error
  if (firstError) throw firstError

  return {
    workspaceId: workspace.id,
    currentMemberId,
    members: ((members.data ?? []) as unknown as MemberRow[]).map(memberFromRow),
    projects: ((projects.data ?? []) as ProjectRow[]).map(projectFromRow),
    assets: ((assets.data ?? []) as AssetRow[]).map(assetFromRow),
    tasks: ((tasks.data ?? []) as TaskRow[]).map(taskFromRow),
    activity: ((activity.data ?? []) as ActivityRow[]).map(activityFromRow),
  }
}
