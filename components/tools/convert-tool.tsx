"use client"

import * as React from "react"
import { RiCloseLine, RiDownloadLine, RiLoader4Line } from "@remixicon/react"

import { Field } from "@/components/app/field"
import { FormSelect } from "@/components/app/filter-select"
import { SaveToProjectButton } from "@/components/tools/save-to-project"
import { ControlSection, ImageDropzone, SizeDelta, ToolLayout } from "@/components/tools/tool-shell"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { formatBytes } from "@/lib/format"
import {
  downloadAll,
  downloadBlob,
  encodeCanvas,
  FORMATS,
  formatMeta,
  loadImages,
  releaseImages,
  toCanvas,
  withExtension,
  type LoadedImage,
  type OutputFormat,
} from "@/lib/tools/image"
import { cn } from "@/lib/utils"

interface Result {
  blob: Blob
  filename: string
}

/** Shared list-based tool used by both the converter and the compressor. */
export function BatchImageTool({
  mode,
}: {
  mode: "convert" | "compress"
}) {
  const [images, setImages] = React.useState<LoadedImage[]>([])
  const [format, setFormat] = React.useState<OutputFormat | "auto">(mode === "convert" ? "webp" : "auto")
  const [quality, setQuality] = React.useState(mode === "convert" ? 0.85 : 0.72)
  const [maxSide, setMaxSide] = React.useState<"none" | "2048" | "1600" | "1200" | "800">("none")
  const [results, setResults] = React.useState<Record<string, Result | "working" | { error: string }>>({})
  const runRef = React.useRef(0)

  React.useEffect(() => () => releaseImages(images), [images])

  const targetFor = React.useCallback(
    (img: LoadedImage): OutputFormat => {
      if (format !== "auto") return format
      // Compress "auto": keep lossy formats, move PNG to WebP.
      if (img.format === "jpeg" || img.format === "webp" || img.format === "avif") return img.format
      return "webp"
    },
    [format]
  )

  const lossyTarget =
    format === "auto" ? true : formatMeta(format).lossy

  // Re-encode whenever inputs or settings change (debounced).
  React.useEffect(() => {
    if (images.length === 0) return
    const run = ++runRef.current
    setResults(Object.fromEntries(images.map((img) => [img.id, "working" as const])))
    const timer = window.setTimeout(async () => {
      for (const img of images) {
        if (run !== runRef.current) return
        try {
          const target = targetFor(img)
          const limit = maxSide === "none" ? Infinity : Number(maxSide)
          const scale = Math.min(1, limit / Math.max(img.width, img.height))
          const canvas = toCanvas(img.bitmap, {
            width: img.width * scale,
            height: img.height * scale,
          })
          const blob = await encodeCanvas(canvas, target, quality)
          if (run !== runRef.current) return
          setResults((r) => ({
            ...r,
            [img.id]: { blob, filename: withExtension(img.name, formatMeta(target).ext) },
          }))
        } catch (err) {
          if (run !== runRef.current) return
          setResults((r) => ({
            ...r,
            [img.id]: { error: err instanceof Error ? err.message : "Failed" },
          }))
        }
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [images, quality, maxSide, targetFor])

  const ready = images
    .map((img) => results[img.id])
    .filter((r): r is Result => Boolean(r && typeof r === "object" && "blob" in r))
  const totalBefore = images.reduce((s, i) => s + i.file.size, 0)
  const totalAfter = ready.reduce((s, r) => s + r.blob.size, 0)

  function addFiles(files: File[]) {
    void loadImages(files).then((loaded) => setImages((prev) => [...prev, ...loaded]))
  }

  function remove(id: string) {
    setImages((prev) => {
      const gone = prev.find((i) => i.id === id)
      if (gone) releaseImages([gone])
      return prev.filter((i) => i.id !== id)
    })
    setResults((r) => {
      const next = { ...r }
      delete next[id]
      return next
    })
  }

  if (images.length === 0) {
    return <ImageDropzone multiple onFiles={addFiles} title="Drop images here" />
  }

  return (
    <ToolLayout
      stage={
        <div className="flex flex-col gap-3">
          <ul className="divide-y divide-border/60 rounded-xl bg-surface ring-1 ring-foreground/5">
            {images.map((img) => {
              const r = results[img.id]
              return (
                <li key={img.id} className="flex items-center gap-4 px-4 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    className="size-12 shrink-0 rounded-md bg-checker object-cover ring-1 ring-foreground/10"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{img.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="uppercase">{img.format ?? "image"}</span>
                      <span className="text-foreground/30">·</span>
                      <span className="tabular-nums">
                        {img.width} × {img.height}
                      </span>
                      <span className="text-foreground/30">·</span>
                      <span className="tabular-nums">{formatBytes(img.file.size)}</span>
                      {r && typeof r === "object" && "blob" in r && (
                        <>
                          <span className="text-foreground/30">→</span>
                          <span className="font-medium text-foreground tabular-nums">
                            {formatBytes(r.blob.size)}
                          </span>
                          <SizeDelta before={img.file.size} after={r.blob.size} />
                        </>
                      )}
                      {r && typeof r === "object" && "error" in r && (
                        <span className="text-destructive">{r.error}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {r === "working" ? (
                      <RiLoader4Line className="size-4 animate-spin text-muted-foreground" />
                    ) : r && typeof r === "object" && "blob" in r ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Download"
                        onClick={() => downloadBlob(r.blob, r.filename)}
                      >
                        <RiDownloadLine />
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => remove(img.id)}>
                      <RiCloseLine />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
          <ImageDropzone
            multiple
            onFiles={addFiles}
            title="Add more images"
            hint="Drop or click to add."
            className="min-h-24 py-6"
          />
        </div>
      }
      controls={
        <>
          <ControlSection title="Output">
            <Field label="Format" htmlFor="batch-format">
              <FormSelect
                id="batch-format"
                value={format}
                onValueChange={setFormat}
                options={[
                  ...(mode === "compress" ? [{ value: "auto" as const, label: "Keep format (PNG → WebP)" }] : []),
                  ...FORMATS.map((f) => ({ value: f.value, label: f.label })),
                ]}
              />
            </Field>
            {lossyTarget && (
              <Field label={`Quality · ${Math.round(quality * 100)}`}>
                <Slider
                  min={0.3}
                  max={1}
                  step={0.01}
                  value={quality}
                  onValueChange={(v) => setQuality(Array.isArray(v) ? v[0] : v)}
                />
              </Field>
            )}
            {mode === "compress" && (
              <Field label="Limit longest side" htmlFor="batch-max">
                <FormSelect
                  id="batch-max"
                  value={maxSide}
                  onValueChange={setMaxSide}
                  options={[
                    { value: "none", label: "Keep original size" },
                    { value: "2048", label: "2048 px" },
                    { value: "1600", label: "1600 px" },
                    { value: "1200", label: "1200 px" },
                    { value: "800", label: "800 px" },
                  ]}
                />
              </Field>
            )}
            {format === "avif" && (
              <p className="text-xs text-muted-foreground">
                AVIF is encoded with WebAssembly and takes a few seconds per image.
              </p>
            )}
          </ControlSection>

          <ControlSection title="Result">
            <div className={cn("rounded-xl bg-surface p-4 ring-1 ring-foreground/5", ready.length === 0 && "opacity-60")}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">
                  {ready.length} of {images.length} ready
                </span>
                {ready.length === images.length && totalBefore > 0 && (
                  <span className="text-xs tabular-nums">
                    {formatBytes(totalBefore)} → <span className="font-medium">{formatBytes(totalAfter)}</span>{" "}
                    <SizeDelta before={totalBefore} after={totalAfter} />
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <Button
                  disabled={ready.length === 0 || ready.length !== images.length}
                  onClick={() => downloadAll(ready)}
                >
                  <RiDownloadLine data-icon="inline-start" />
                  Download {ready.length > 1 ? `all (${ready.length})` : ""}
                </Button>
                {ready.length === 1 && (
                  <SaveToProjectButton blob={ready[0].blob} filename={ready[0].filename} />
                )}
              </div>
            </div>
          </ControlSection>
        </>
      }
    />
  )
}
