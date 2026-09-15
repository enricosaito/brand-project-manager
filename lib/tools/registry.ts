import type { ComponentType } from "react"
import {
  RiAspectRatioLine,
  RiCropLine,
  RiEraserLine,
  RiFilePdf2Line,
  RiFileZipLine,
  RiPaletteLine,
  RiRepeatLine,
} from "@remixicon/react"

export type ToolSlug =
  | "convert"
  | "compress"
  | "resize"
  | "crop"
  | "remove-background"
  | "colors"
  | "pdf"

export interface ToolDefinition {
  slug: ToolSlug
  name: string
  /** Short label for compact navigation. */
  short: string
  /** Label used in the sidebar. */
  nav: string
  description: string
  icon: ComponentType<{ className?: string }>
}

/**
 * Single-purpose image tools. Everything runs in the browser; nothing is
 * uploaded unless the user explicitly saves a result to a project.
 */
export const TOOLS: ToolDefinition[] = [
  {
    slug: "convert",
    name: "Image converter",
    short: "Convert",
    nav: "Converter",
    description: "Turn PNG, JPG, WebP and AVIF into any other format.",
    icon: RiRepeatLine,
  },
  {
    slug: "compress",
    name: "Image compressor",
    short: "Compress",
    nav: "Compressor",
    description: "Shrink file size with a quality dial and a live before/after.",
    icon: RiFileZipLine,
  },
  {
    slug: "resize",
    name: "Image resizer",
    short: "Resize",
    nav: "Resizer",
    description: "Exact pixels, percentages or a longest-side limit.",
    icon: RiAspectRatioLine,
  },
  {
    slug: "crop",
    name: "Social media cropper",
    short: "Crop",
    nav: "Social cropper",
    description: "Frame an image for Instagram, YouTube, LinkedIn, X and more.",
    icon: RiCropLine,
  },
  {
    slug: "remove-background",
    name: "Background remover",
    short: "Remove background",
    nav: "Background remover",
    description: "Cut out the subject and export a transparent PNG.",
    icon: RiEraserLine,
  },
  {
    slug: "colors",
    name: "Color extractor",
    short: "Colors",
    nav: "Color extractor",
    description: "Pull a palette from any image, or pick colors by hand.",
    icon: RiPaletteLine,
  },
  {
    slug: "pdf",
    name: "Image to PDF",
    short: "To PDF",
    nav: "Image to PDF",
    description: "Combine images into a single PDF, one per page.",
    icon: RiFilePdf2Line,
  },
]

export function getTool(slug: string) {
  return TOOLS.find((t) => t.slug === slug)
}
