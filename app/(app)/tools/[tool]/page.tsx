import { notFound } from "next/navigation"

import { BackgroundTool } from "@/components/tools/background-tool"
import { ColorsTool } from "@/components/tools/colors-tool"
import { BatchImageTool } from "@/components/tools/convert-tool"
import { CropTool } from "@/components/tools/crop-tool"
import { PdfTool } from "@/components/tools/pdf-tool"
import { ResizeTool } from "@/components/tools/resize-tool"
import { ToolPage } from "@/components/tools/tool-shell"
import { getTool, TOOLS, type ToolSlug } from "@/lib/tools/registry"

export function generateStaticParams() {
  return TOOLS.map((t) => ({ tool: t.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params
  return { title: getTool(tool)?.name ?? "Tools" }
}

const TOOL_COMPONENTS: Record<ToolSlug, React.ComponentType> = {
  convert: () => <BatchImageTool mode="convert" />,
  compress: () => <BatchImageTool mode="compress" />,
  resize: ResizeTool,
  crop: CropTool,
  "remove-background": BackgroundTool,
  colors: ColorsTool,
  pdf: PdfTool,
}

export default async function ToolRoute({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params
  const definition = getTool(tool)
  if (!definition) notFound()
  const Tool = TOOL_COMPONENTS[definition.slug]
  return (
    <ToolPage slug={definition.slug}>
      <Tool />
    </ToolPage>
  )
}
