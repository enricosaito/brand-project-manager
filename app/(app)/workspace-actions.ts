"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import * as mock from "@/data"
import { WORKSPACE_COOKIE } from "@/lib/supabase/queries"
import {
  activityToRow,
  assetToRow,
  projectToRow,
  taskToRow,
  type WorkspaceRow,
} from "@/lib/supabase/rows"
import { createClient } from "@/lib/supabase/server"

const ONE_YEAR = 60 * 60 * 24 * 365

async function rememberWorkspace(id: string) {
  const cookieStore = await cookies()
  cookieStore.set(WORKSPACE_COOKIE, id, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
    httpOnly: true,
  })
}

export async function switchWorkspace(id: string) {
  await rememberWorkspace(id)
  redirect("/projects")
}

export async function createWorkspace(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const name = String(formData.get("name") ?? "").trim()
  const color = String(formData.get("color") ?? "#1F1BE4").trim()
  if (!name) return { error: "Give the workspace a name." }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("create_workspace", {
    ws_name: name,
    ws_color: color,
  })
  if (error) return { error: error.message }

  await rememberWorkspace((data as WorkspaceRow).id)
  redirect("/projects")
}

/**
 * Copies the mock dataset into the current workspace so a fresh account has
 * something to look at. Every mock member becomes the current user.
 */
export async function seedSampleData(workspaceId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in." }

  const me = user.id
  const idMap = new Map<string, string>()
  const mapId = (mockId: string) => {
    let id = idMap.get(mockId)
    if (!id) {
      id = crypto.randomUUID()
      idMap.set(mockId, id)
    }
    return id
  }

  const projects = mock.projects.map((p) =>
    projectToRow({ ...p, id: mapId(p.id), ownerId: me }, workspaceId)
  )
  const assets = mock.assets.map((a) =>
    assetToRow(
      { ...a, id: mapId(a.id), projectId: mapId(a.projectId), uploadedById: me },
      workspaceId
    )
  )
  const tasks = mock.tasks.map((t) =>
    taskToRow(
      {
        ...t,
        id: mapId(t.id),
        projectId: mapId(t.projectId),
        assigneeId: t.assigneeId ? me : undefined,
      },
      workspaceId
    )
  )
  const activity = mock.activity.map((e) =>
    activityToRow(
      { ...e, id: mapId(e.id), projectId: mapId(e.projectId), actorId: e.actorId ? me : undefined },
      workspaceId
    )
  )

  const steps = [
    supabase.from("projects").insert(projects),
    supabase.from("assets").insert(assets),
    supabase.from("tasks").insert(tasks),
    supabase.from("activity_events").insert(activity),
  ]
  for (const step of steps) {
    const { error } = await step
    if (error) return { error: error.message }
  }
  redirect("/projects")
}
