"use client"

import * as React from "react"

import { ProjectOverview } from "@/components/projects/project-overview"
import { useProject } from "@/lib/store/workspace"

export default function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = React.use(params)
  const project = useProject(projectId)
  if (!project) return null
  return <ProjectOverview project={project} />
}
