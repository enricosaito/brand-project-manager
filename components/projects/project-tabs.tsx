"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

interface ProjectTabsProps {
  projectId: string
  counts?: Partial<Record<"assets" | "tasks" | "activity", number>>
}

/**
 * Route-based tab navigation for the project detail area.
 * Each tab is a real URL so views are deep-linkable.
 */
export function ProjectTabs({ projectId, counts }: ProjectTabsProps) {
  const pathname = usePathname()
  const base = `/projects/${projectId}`

  const tabs = [
    { href: base, label: "Overview", exact: true },
    { href: `${base}/assets`, label: "Assets", count: counts?.assets },
    { href: `${base}/tasks`, label: "Tasks", count: counts?.tasks },
    { href: `${base}/activity`, label: "Activity" },
  ]

  return (
    <nav
      aria-label="Project sections"
      className="scrollbar-thin -mx-1 flex items-center gap-1 overflow-x-auto border-b border-border"
    >
      {tabs.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group/tab relative flex h-10 shrink-0 items-center gap-1.5 px-3 text-sm outline-none transition-colors duration-150",
              active
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="rounded-md px-1 py-0.5 transition-colors group-focus-visible/tab:bg-muted">
              {tab.label}
            </span>
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "text-xs tabular-nums transition-colors",
                  active ? "text-muted-foreground" : "text-muted-foreground/60"
                )}
              >
                {tab.count}
              </span>
            )}
            <span
              className={cn(
                "absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-foreground transition-[opacity,transform] duration-200 ease-out-quart",
                active ? "scale-x-100 opacity-100" : "scale-x-50 opacity-0"
              )}
            />
          </Link>
        )
      })}
    </nav>
  )
}
