import { ProjectActivityPage } from "@/components/projects/project-pages"

export default function DemoProjectActivity({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  return <ProjectActivityPage params={params} />
}
