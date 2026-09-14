import { ProjectOverviewPage } from "@/components/projects/project-pages"

export default function DemoProjectOverview({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  return <ProjectOverviewPage params={params} />
}
