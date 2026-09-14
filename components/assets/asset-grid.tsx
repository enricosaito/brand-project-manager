import { AssetCard } from "@/components/assets/asset-card"
import type { Asset } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AssetGridProps {
  assets: Asset[]
  onOpen: (asset: Asset) => void
  /** Map of projectId → name, when assets from several projects are shown. */
  projectNames?: Record<string, string>
  className?: string
  /** Dense grids for smaller panels (e.g. overview). */
  dense?: boolean
}

export function AssetGrid({
  assets,
  onOpen,
  projectNames,
  className,
  dense = false,
}: AssetGridProps) {
  return (
    <div
      className={cn(
        "grid gap-x-5 gap-y-7",
        dense
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5",
        className
      )}
    >
      {assets.map((asset, i) => (
        <div
          key={asset.id}
          className="animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both duration-300 ease-out-quart"
          style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
        >
          <AssetCard
            asset={asset}
            onOpen={onOpen}
            projectName={projectNames?.[asset.projectId]}
          />
        </div>
      ))}
    </div>
  )
}
