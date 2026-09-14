"use client"

import * as React from "react"

import { ActivityTimeline } from "@/components/activity/activity-timeline"
import { useActivity } from "@/lib/store/workspace"

export default function ProjectActivityPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = React.use(params)
  const events = useActivity(projectId)
  return (
    <div className="max-w-2xl">
      <ActivityTimeline events={events} />
    </div>
  )
}
