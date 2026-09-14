import type { AssetType } from "@/lib/types"
import { cn } from "@/lib/utils"

const SIZES = {
  sm: { w: "w-8", text: "text-[8px]" },
  md: { w: "w-12", text: "text-[10px]" },
  lg: { w: "w-24", text: "text-sm" },
} as const

function extensionTone(type: AssetType, extension: string) {
  if (extension === "pdf") return "text-destructive"
  if (type === "design") return "text-brand"
  if (type === "presentation") return "text-warning"
  return "text-foreground/70"
}

interface FileGlyphProps {
  extension: string
  type: AssetType
  size?: keyof typeof SIZES
  className?: string
}

/**
 * A quiet document glyph used wherever a file has no visual preview.
 * The extension is the only "color" — enough to scan a grid of documents.
 */
export function FileGlyph({ extension, type, size = "md", className }: FileGlyphProps) {
  const s = SIZES[size]
  return (
    <div className={cn("relative inline-flex", s.w, className)} aria-hidden>
      <svg viewBox="0 0 40 52" className="w-full drop-shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        <path
          d="M4 .5h22L39.5 14v35.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-47a2 2 0 0 1 2-2Z"
          className="fill-card stroke-foreground/20"
        />
        <path
          d="M26 .5V12a2 2 0 0 0 2 2h11.5"
          className="fill-muted stroke-foreground/20"
        />
      </svg>
      <span
        className={cn(
          "absolute inset-x-0 bottom-[22%] text-center font-mono font-medium tracking-wider uppercase",
          s.text,
          extensionTone(type, extension)
        )}
      >
        {extension}
      </span>
    </div>
  )
}
