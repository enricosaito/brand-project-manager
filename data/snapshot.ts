import type { WorkspaceSnapshot } from "@/lib/store/workspace"

import { activity } from "./activity"
import { assets } from "./assets"
import { CURRENT_MEMBER_ID, members } from "./members"
import { projects } from "./projects"
import { tasks } from "./tasks"

/** The full mock dataset as a store snapshot, used by the /demo routes. */
export const DEMO_WORKSPACE_ID = "demo"

export function demoSnapshot(): WorkspaceSnapshot {
  return {
    workspaceId: DEMO_WORKSPACE_ID,
    currentMemberId: CURRENT_MEMBER_ID,
    members,
    projects,
    assets,
    tasks,
    activity,
  }
}
