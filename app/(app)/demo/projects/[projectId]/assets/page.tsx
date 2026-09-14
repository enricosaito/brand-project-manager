import { ProjectAssetsPage } from "@/components/projects/project-pages"

export default function DemoProjectAssets({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  return <ProjectAssetsPage params={params} />
}
