import Link from "next/link"
import { RiArrowRightLine, RiFlaskLine } from "@remixicon/react"

import { demoSnapshot } from "@/data/snapshot"
import { WorkspaceProvider } from "@/lib/store/workspace"

/**
 * Reference workspace backed by the mock dataset. Nothing here is persisted;
 * it exists so the intended look and feel of a busy workspace stays visible
 * while the real one fills up.
 */
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider mode="demo" basePath="/demo" initialState={demoSnapshot()}>
      <div className="sticky top-14 z-20 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs text-foreground/80 backdrop-blur-md md:top-0">
        <RiFlaskLine className="size-3.5 text-warning" />
        <span>
          <span className="font-medium">Demo data.</span> Changes here are not saved.
        </span>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
        >
          Back to your workspace
          <RiArrowRightLine className="size-3.5" />
        </Link>
      </div>
      {children}
    </WorkspaceProvider>
  )
}
