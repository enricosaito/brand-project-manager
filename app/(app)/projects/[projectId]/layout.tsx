"use client"

import * as React from "react"
import { RiFolder3Line } from "@remixicon/react"

import { PageContainer } from "@/components/app/app-shell"
import { EmptyState } from "@/components/app/empty-state"
import { ProjectHeader } from "@/components/projects/project-header"
import { ProjectTabs } from "@/components/projects/project-tabs"
import { Button } from "@/components/ui/button"
import { useProject, useProjectStats } from "@/lib/store/workspace"
import Link from "next/link"

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = React.use(params)
  const project = useProject(projectId)
  const stats = useProjectStats(projectId)

  if (!project) {
    return (
      <PageContainer>
        <EmptyState
          icon={<RiFolder3Line />}
          title="Project not found"
          description="This project may have been deleted, or the link is out of date."
          action={
            <Button variant="outline" render={<Link href="/projects" />}>
              Back to projects
            </Button>
          }
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="animate-in fade-in-0 duration-300">
      <ProjectHeader project={project} />
      <div className="mt-10">
        <ProjectTabs
          projectId={project.id}
          counts={{ assets: stats.assetCount, tasks: stats.openCount }}
        />
      </div>
      <div key={project.id} className="pt-8">
        {children}
      </div>
    </PageContainer>
  )
}
