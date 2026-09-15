"use client"

import * as React from "react"
import { RiCheckLine } from "@remixicon/react"

import { Field } from "@/components/app/field"
import { FormSelect } from "@/components/app/filter-select"
import { Chip } from "@/components/tools/resize-tool"
import {
  BusyBar,
  ControlSection,
  ImageDropzone,
  OutputActions,
  Stage,
  ToolLayout,
  useObjectUrl,
} from "@/components/tools/tool-shell"
import { Button } from "@/components/ui/button"
import { removeImageBackground, type RemovalProgress } from "@/lib/tools/background"
import {
  encodeCanvas,
  loadBitmap,
  loadImages,
  releaseImages,
  toCanvas,
  withSuffix,
  type LoadedImage,
  type OutputFormat,
} from "@/lib/tools/image"
import { cn } from "@/lib/utils"

const FILLS = [
  { id: "transparent", label: "Transparent", color: null },
  { id: "white", label: "White", color: "#FFFFFF" },
  { id: "black", label: "Black", color: "#111111" },
  { id: "brand", label: "Brand orange", color: "#F2460D" },
  { id: "blue", label: "Brand blue", color: "#1F1BE4" },
  { id: "custom", label: "Custom", color: "custom" },
]

export function BackgroundTool() {
  const [image, setImage] = React.useState<LoadedImage | null>(null)
  const [cutout, setCutout] = React.useState<Blob | null>(null)
  const [progress, setProgress] = React.useState<RemovalProgress | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [fill, setFill] = React.useState("transparent")
  const [customColor, setCustomColor] = React.useState("#E8E4DC")
  const [format, setFormat] = React.useState<OutputFormat>("png")
  const [output, setOutput] = React.useState<Blob | null>(null)
  const [compare, setCompare] = React.useState(false)
  const outputUrl = useObjectUrl(output)

  React.useEffect(() => {
    return () => {
      if (image) releaseImages([image])
    }
  }, [image])

  async function load(files: File[]) {
    const [img] = await loadImages(files)
    if (!img) return
    setImage(img)
    setCutout(null)
    setOutput(null)
    setError(null)
    setProgress({ fraction: 0, label: "Preparing" })
    try {
      const result = await removeImageBackground(img.file, setProgress)
      setCutout(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Background removal failed")
    } finally {
      setProgress(null)
    }
  }

  const fillColor =
    fill === "transparent" ? null : fill === "custom" ? customColor : (FILLS.find((f) => f.id === fill)?.color ?? null)

  // Composite the cutout on the chosen background and encode.
  React.useEffect(() => {
    if (!cutout) return
    let cancelled = false
    ;(async () => {
      const bitmap = await loadBitmap(cutout)
      const canvas = toCanvas(bitmap, { background: fillColor ?? undefined })
      bitmap.close()
      const target: OutputFormat = fillColor ? format : "png"
      const out = await encodeCanvas(canvas, target, 0.92)
      if (!cancelled) setOutput(out)
    })()
    return () => {
      cancelled = true
    }
  }, [cutout, fillColor, format])

  if (!image) {
    return (
      <div className="flex flex-col gap-4">
        <ImageDropzone onFiles={load} hint="Works best on photos with a clear subject. Files never leave your browser." />
        <p className="text-xs text-muted-foreground">
          The first run downloads a ~40 MB model that your browser keeps for next time.
        </p>
      </div>
    )
  }

  const ext = fillColor ? (format === "jpeg" ? "jpg" : format) : "png"
  const filename = withSuffix(image.name, "-cutout", ext)

  return (
    <ToolLayout
      stage={
        <div className="flex flex-col gap-3">
          <Stage checker className="min-h-[24rem]">
            {progress ? (
              <div className="flex flex-col items-center gap-5 p-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="max-h-64 max-w-full rounded-md object-contain opacity-40 blur-[1px]" />
                <BusyBar label={progress.label} fraction={progress.fraction} />
              </div>
            ) : error ? (
              <div className="p-8 text-center text-sm text-destructive">{error}</div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={compare || !outputUrl ? image.url : outputUrl}
                alt=""
                className="max-h-[70vh] max-w-full object-contain"
              />
            )}
          </Stage>
          {output && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="tabular-nums">
                {image.width} × {image.height}
              </span>
              <button
                type="button"
                onPointerDown={() => setCompare(true)}
                onPointerUp={() => setCompare(false)}
                onPointerLeave={() => setCompare(false)}
                className="rounded-md bg-secondary px-2.5 py-1 font-medium text-foreground/80 select-none hover:text-foreground"
              >
                Hold to compare
              </button>
            </div>
          )}
        </div>
      }
      controls={
        <>
          <ControlSection title="Background">
            <div className="flex flex-wrap gap-1.5">
              {FILLS.map((f) => (
                <Chip key={f.id} active={fill === f.id} onClick={() => setFill(f.id)}>
                  {f.color && f.color !== "custom" && (
                    <span
                      className="mr-1.5 inline-block size-2.5 rounded-full ring-1 ring-black/10"
                      style={{ backgroundColor: f.color }}
                    />
                  )}
                  {f.label}
                </Chip>
              ))}
            </div>
            {fill === "custom" && (
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="size-8 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                />
                <span className="font-mono text-xs text-muted-foreground uppercase">{customColor}</span>
              </label>
            )}
            {fillColor && (
              <Field label="File type" htmlFor="bg-format">
                <FormSelect
                  id="bg-format"
                  value={format}
                  onValueChange={setFormat}
                  options={[
                    { value: "png", label: "PNG" },
                    { value: "jpeg", label: "JPG" },
                    { value: "webp", label: "WebP" },
                  ]}
                />
              </Field>
            )}
            {!fillColor && (
              <p className="text-xs text-muted-foreground">Transparent results are always exported as PNG.</p>
            )}
          </ControlSection>

          {cutout && (
            <div className={cn("flex items-center gap-2 text-xs text-success")}>
              <RiCheckLine className="size-3.5" />
              Subject isolated
            </div>
          )}

          <OutputActions
            blob={output}
            filename={filename}
            busy={Boolean(progress)}
            onReset={() => {
              setImage(null)
              setCutout(null)
              setOutput(null)
            }}
          />
          {error && (
            <Button variant="outline" onClick={() => load([image.file])}>
              Try again
            </Button>
          )}
        </>
      }
    />
  )
}
