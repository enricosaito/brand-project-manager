"use client"

/**
 * Background removal, isolated so the implementation can be swapped.
 *
 * Current engine: @imgly/background-removal (runs entirely in the browser,
 * downloads its ~40 MB model once and caches it). NOTE: that package is
 * licensed under AGPL-3.0; a commercial licence from IMG.LY or a different
 * engine is required before shipping this to paying customers.
 */

export interface RemovalProgress {
  /** 0–1 for the item currently being fetched/processed. */
  fraction: number
  /** Human readable phase. */
  label: string
}

export async function removeImageBackground(
  file: Blob,
  onProgress?: (progress: RemovalProgress) => void
): Promise<Blob> {
  const { removeBackground } = await import("@imgly/background-removal")
  return removeBackground(file, {
    model: "isnet_fp16",
    output: { format: "image/png", quality: 1 },
    progress: (key, current, total) => {
      const fraction = total > 0 ? current / total : 0
      const label = key.startsWith("fetch:")
        ? "Downloading model"
        : key.startsWith("compute:")
          ? "Cutting out the subject"
          : "Preparing"
      onProgress?.({ fraction, label })
    },
  })
}
