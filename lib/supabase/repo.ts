"use client"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { ActivityEvent, Asset, Project, Task } from "@/lib/types"

import {
  activityToRow,
  assetPatchToRow,
  assetToRow,
  projectPatchToRow,
  projectToRow,
  taskPatchToRow,
  taskToRow,
} from "./rows"
import { ASSETS_BUCKET, objectPathsFor } from "./storage"

/**
 * Browser-side persistence used by the workspace store in live mode.
 * Every function throws on failure so the store can roll back its
 * optimistic update.
 */
export function createRepo(supabase: SupabaseClient, workspaceId: string) {
  const fail = (error: { message: string } | null) => {
    if (error) throw new Error(error.message)
  }

  return {
    async insertProject(project: Project) {
      fail((await supabase.from("projects").insert(projectToRow(project, workspaceId))).error)
    },
    async updateProject(id: string, patch: Partial<Project>) {
      fail((await supabase.from("projects").update(projectPatchToRow(patch)).eq("id", id)).error)
    },
    async deleteProject(id: string, assets: Asset[]) {
      const paths = assets.flatMap(objectPathsFor)
      if (paths.length > 0) {
        await supabase.storage.from(ASSETS_BUCKET).remove(paths)
      }
      fail((await supabase.from("projects").delete().eq("id", id)).error)
    },

    async insertAsset(asset: Asset) {
      fail((await supabase.from("assets").insert(assetToRow(asset, workspaceId))).error)
    },
    async updateAsset(id: string, patch: Partial<Asset>) {
      fail((await supabase.from("assets").update(assetPatchToRow(patch)).eq("id", id)).error)
    },
    async deleteAsset(asset: Asset) {
      const paths = objectPathsFor(asset)
      if (paths.length > 0) {
        await supabase.storage.from(ASSETS_BUCKET).remove(paths)
      }
      fail((await supabase.from("assets").delete().eq("id", asset.id)).error)
    },

    async insertTask(task: Task) {
      fail((await supabase.from("tasks").insert(taskToRow(task, workspaceId))).error)
    },
    async updateTask(id: string, patch: Partial<Task>) {
      fail((await supabase.from("tasks").update(taskPatchToRow(patch)).eq("id", id)).error)
    },
    async deleteTask(id: string) {
      fail((await supabase.from("tasks").delete().eq("id", id)).error)
    },

    async insertActivity(event: ActivityEvent) {
      fail((await supabase.from("activity_events").insert(activityToRow(event, workspaceId))).error)
    },
  }
}

export type Repo = ReturnType<typeof createRepo>
