"use client"

/**
 * Browser-side image helpers shared by the tools. Everything works on
 * ImageBitmap + Canvas so nothing leaves the device.
 */

export type OutputFormat = "png" | "jpeg" | "webp" | "avif"

export interface FormatMeta {
  value: OutputFormat
  label: string
  mime: string
  ext: string
  lossy: boolean
}

export const FORMATS: FormatMeta[] = [
  { value: "png", label: "PNG", mime: "image/png", ext: "png", lossy: false },
  { value: "jpeg", label: "JPG", mime: "image/jpeg", ext: "jpg", lossy: true },
  { value: "webp", label: "WebP", mime: "image/webp", ext: "webp", lossy: true },
  { value: "avif", label: "AVIF", mime: "image/avif", ext: "avif", lossy: true },
]

export function formatMeta(format: OutputFormat) {
  return FORMATS.find((f) => f.value === format) ?? FORMATS[0]
}

/** Detects the format of an input file from its MIME type or extension. */
export function formatOfFile(file: File): OutputFormat | null {
  const type = file.type.toLowerCase()
  if (type === "image/png") return "png"
  if (type === "image/jpeg" || type === "image/jpg") return "jpeg"
  if (type === "image/webp") return "webp"
  if (type === "image/avif") return "avif"
  const ext = file.name.split(".").pop()?.toLowerCase()
  if (ext === "png") return "png"
  if (ext === "jpg" || ext === "jpeg") return "jpeg"
  if (ext === "webp") return "webp"
  if (ext === "avif") return "avif"
  return null
}

export async function loadBitmap(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob, { imageOrientation: "from-image" })
}

interface DrawOptions {
  width?: number
  height?: number
  /** Fill colour behind the image (needed for JPEG, which has no alpha). */
  background?: string
}

/** Draws a bitmap (or canvas) onto a new canvas, optionally scaled. */
export function toCanvas(
  source: ImageBitmap | HTMLCanvasElement,
  { width = source.width, height = source.height, background }: DrawOptions = {}
): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context unavailable")
  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

/**
 * Browsers cannot encode AVIF through Canvas, so we use the jSquash WASM
 * encoder (Apache-2.0). It is loaded at runtime from a CDN rather than
 * bundled: Turbopack's production build hangs on the package's WASM/worker
 * graph, and the ~1 MB codec only matters to users who pick AVIF.
 */
const AVIF_ENCODER_URL = "https://cdn.jsdelivr.net/npm/@jsquash/avif@2.1.1/+esm"

type AvifEncode = (
  data: ImageData,
  options: { quality: number; speed: number }
) => Promise<ArrayBuffer>

let avifEncoderPromise: Promise<AvifEncode> | null = null

function loadAvifEncoder(): Promise<AvifEncode> {
  if (!avifEncoderPromise) {
    avifEncoderPromise = import(
      /* webpackIgnore: true */ /* turbopackIgnore: true */ AVIF_ENCODER_URL
    )
      .then((mod: { encode?: AvifEncode; default?: AvifEncode }) => {
        const encode = mod.encode ?? mod.default
        if (!encode) throw new Error("AVIF encoder unavailable")
        return encode
      })
      .catch((err: unknown) => {
        avifEncoderPromise = null
        throw err instanceof Error ? err : new Error("Could not load the AVIF encoder")
      })
  }
  return avifEncoderPromise
}

/** Encodes a canvas into the requested format. `quality` is 0–1 for lossy formats. */
export async function encodeCanvas(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality = 0.82
): Promise<Blob> {
  if (format === "avif") {
    const encodeAvif = await loadAvifEncoder()
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas 2D context unavailable")
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const buffer = await encodeAvif(data, {
      quality: Math.round(quality * 100),
      speed: 7,
    })
    return new Blob([buffer], { type: "image/avif" })
  }

  // JPEG cannot carry transparency: flatten onto white first.
  const source = format === "jpeg" ? toCanvas(canvas, { background: "#ffffff" }) : canvas
  const meta = formatMeta(format)

  return new Promise((resolve, reject) => {
    source.toBlob(
      (blob) => {
        if (!blob) return reject(new Error(`Could not encode ${meta.label}`))
        if (blob.type !== meta.mime) {
          return reject(new Error(`${meta.label} export is not supported by this browser`))
        }
        resolve(blob)
      },
      meta.mime,
      meta.lossy ? quality : undefined
    )
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function downloadAll(items: { blob: Blob; filename: string }[]) {
  for (const item of items) {
    downloadBlob(item.blob, item.filename)
    await new Promise((r) => window.setTimeout(r, 350))
  }
}

export function stripExtension(name: string) {
  const idx = name.lastIndexOf(".")
  return idx > 0 ? name.slice(0, idx) : name
}

export function withExtension(name: string, ext: string) {
  return `${stripExtension(name)}.${ext}`
}

export function withSuffix(name: string, suffix: string, ext?: string) {
  const base = stripExtension(name)
  const finalExt = ext ?? name.split(".").pop() ?? "png"
  return `${base}${suffix}.${finalExt}`
}

/** Largest size with the same aspect ratio that fits inside max bounds. */
export function fitWithin(width: number, height: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(1, maxWidth / width, maxHeight / height)
  return { width: Math.round(width * scale), height: Math.round(height * scale), scale }
}

export interface LoadedImage {
  id: string
  file: File
  name: string
  url: string
  bitmap: ImageBitmap
  width: number
  height: number
  format: OutputFormat | null
}

export async function loadImages(files: File[]): Promise<LoadedImage[]> {
  const results: LoadedImage[] = []
  for (const file of files) {
    if (!file.type.startsWith("image/") && !formatOfFile(file)) continue
    try {
      const bitmap = await loadBitmap(file)
      results.push({
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        name: file.name,
        url: URL.createObjectURL(file),
        bitmap,
        width: bitmap.width,
        height: bitmap.height,
        format: formatOfFile(file),
      })
    } catch {
      // Unsupported or corrupt image: skip it.
    }
  }
  return results
}

export function releaseImages(images: LoadedImage[]) {
  for (const img of images) {
    URL.revokeObjectURL(img.url)
    img.bitmap.close()
  }
}

export function percentSaved(before: number, after: number) {
  if (before === 0) return 0
  return Math.round(((before - after) / before) * 100)
}
