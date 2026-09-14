"use client"

import * as React from "react"

import { TaskList } from "@/components/tasks/task-list"

export default function ProjectTasksPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = React.use(params)
  return <TaskList projectId={projectId} />
}
