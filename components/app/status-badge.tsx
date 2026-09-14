import { projectStatusMeta, taskStatusMeta } from "@/lib/labels"
import type { ProjectStatus, TaskStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StatusDotProps {
  className?: string
  dotClassName: string
  label: string
  /** "inline" renders text next to the dot; "pill" adds a subtle container. */
  variant?: "inline" | "pill"
}

function StatusDot({
  className,
  dotClassName,
  label,
  variant = "inline",
}: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap text-foreground/80",
        variant === "pill" &&
          "h-6 rounded-md bg-background/80 px-2 ring-1 ring-foreground/10 backdrop-blur-sm",
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", dotClassName)} />
      {label}
    </span>
  )
}

export function ProjectStatusBadge({
  status,
  className,
  variant,
}: {
  status: ProjectStatus
  className?: string
  variant?: "inline" | "pill"
}) {
  const meta = projectStatusMeta(status)
  return (
    <StatusDot
      label={meta.label}
      dotClassName={meta.dot}
      className={className}
      variant={variant}
    />
  )
}

export function TaskStatusBadge({
  status,
  className,
  variant,
}: {
  status: TaskStatus
  className?: string
  variant?: "inline" | "pill"
}) {
  const meta = taskStatusMeta(status)
  return (
    <StatusDot
      label={meta.label}
      dotClassName={meta.dot}
      className={className}
      variant={variant}
    />
  )
}
