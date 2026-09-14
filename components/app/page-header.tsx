import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-display text-balance">{title}</h1>
        {description && (
          <p className="mt-2 max-w-xl text-[15px] text-pretty text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

interface SectionHeaderProps {
  title: string
  count?: number
  action?: ReactNode
  className?: string
}

export function SectionHeader({
  title,
  count,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-baseline justify-between", className)}>
      <h2 className="flex items-baseline gap-2 text-sm font-medium text-foreground">
        {title}
        {typeof count === "number" && (
          <span className="font-sans text-xs font-normal text-muted-foreground tabular-nums">
            {count}
          </span>
        )}
      </h2>
      {action}
    </div>
  )
}
