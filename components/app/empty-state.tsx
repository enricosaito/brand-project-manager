import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
  /** "page" for full-page empties, "section" for smaller panels. */
  size?: "page" | "section"
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = "page",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center animate-in fade-in-0 duration-300",
        size === "page" ? "min-h-[28rem] py-16" : "min-h-48 py-10",
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "mb-5 flex items-center justify-center rounded-xl bg-secondary text-muted-foreground",
            size === "page" ? "size-12 [&_svg]:size-5" : "size-10 [&_svg]:size-4"
          )}
        >
          {icon}
        </div>
      )}
      <h3
        className={cn(
          "font-heading font-medium text-foreground",
          size === "page" ? "text-lg" : "text-base"
        )}
      >
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-xs text-sm text-pretty text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
