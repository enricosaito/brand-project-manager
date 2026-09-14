import { ProjectDetailLayout } from "@/components/projects/project-detail-layout"

export default function DemoProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  return <ProjectDetailLayout params={params}>{children}</ProjectDetailLayout>
}
