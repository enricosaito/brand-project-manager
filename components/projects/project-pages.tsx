"use client"

import * as React from "react"

import { ActivityTimeline } from "@/components/activity/activity-timeline"
import { AssetLibrary } from "@/components/assets/asset-library"
import { ProjectOverview } from "@/components/projects/project-overview"
import { TaskList } from "@/components/tasks/task-list"
import { useActivity, useProject } from "@/lib/store/workspace"

/**
 * Bodies of the project tab routes. The route files under (live) and demo
 * are thin wrappers around these so both trees stay identical.
 */

type Params = { params: Promise<{ projectId: string }> }

export function ProjectOverviewPage({ params }: Params) {
  const { projectId } = React.use(params)
  const project = useProject(projectId)
  if (!project) return null
  return <ProjectOverview project={project} />
}

export function ProjectAssetsPage({ params }: Params) {
  const { projectId } = React.use(params)
  return <AssetLibrary projectId={projectId} />
}

export function ProjectTasksPage({ params }: Params) {
  const { projectId } = React.use(params)
  return <TaskList projectId={projectId} />
}

export function ProjectActivityPage({ params }: Params) {
  const { projectId } = React.use(params)
  const events = useActivity(projectId)
  return (
    <div className="max-w-2xl">
      <ActivityTimeline events={events} />
    </div>
  )
}
