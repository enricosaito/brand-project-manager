import { ProjectCard } from "@/components/projects/project-card"
import type { Project } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ProjectGrid({
  projects,
  className,
}: {
  projects: Project[]
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3",
        className
      )}
    >
      {projects.map((project, i) => (
        <div
          key={project.id}
          className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both duration-300 ease-out-quart"
          style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
        >
          <ProjectCard project={project} />
        </div>
      ))}
    </div>
  )
}
