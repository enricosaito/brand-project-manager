import { ProjectTasksPage } from "@/components/projects/project-pages"

export default function DemoProjectTasks({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  return <ProjectTasksPage params={params} />
}
