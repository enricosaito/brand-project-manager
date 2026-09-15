import Link from "next/link"
import { RiArrowRightUpLine } from "@remixicon/react"

import { PageContainer } from "@/components/app/app-shell"
import { PageHeader } from "@/components/app/page-header"
import { TOOLS } from "@/lib/tools/registry"

export const metadata = { title: "Tools" }

export default function ToolsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Tools"
        description="Quick, private image utilities. Everything runs in your browser; save results straight into a project."
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="group/tool flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/[0.06] transition-[transform,box-shadow] duration-300 ease-out-quart outline-none hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.2)] focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <div className="flex items-start justify-between">
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground/80 transition-colors group-hover/tool:bg-foreground group-hover/tool:text-background">
                <tool.icon className="size-5" />
              </span>
              <RiArrowRightUpLine className="size-4 translate-y-1 text-muted-foreground opacity-0 transition-[opacity,transform] duration-200 ease-out-quart group-hover/tool:translate-y-0 group-hover/tool:opacity-100" />
            </div>
            <div>
              <h2 className="text-title">{tool.name}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">
                {tool.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </PageContainer>
  )
}
