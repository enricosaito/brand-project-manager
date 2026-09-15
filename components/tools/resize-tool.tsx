"use client"

import * as React from "react"
import { RiLockLine, RiLockUnlockLine } from "@remixicon/react"

import { Field } from "@/components/app/field"
import { FormSelect } from "@/components/app/filter-select"
import {
  ControlSection,
  ImageDropzone,
  OutputActions,
  Stage,
  ToolLayout,
  useObjectUrl,
} from "@/components/tools/tool-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
  encodeCanvas,
  FORMATS,
  formatMeta,
  loadImages,
  releaseImages,
  toCanvas,
  withSuffix,
  type LoadedImage,
  type OutputFormat,
} from "@/lib/tools/image"
import { cn } from "@/lib/utils"

const PRESETS = [2048, 1920, 1600, 1280, 1080, 800, 512, 256]

export function ResizeTool() {
  const [image, setImage] = React.useState<LoadedImage | null>(null)
  const [width, setWidth] = React.useState(0)
  const [height, setHeight] = React.useState(0)
  const [locked, setLocked] = React.useState(true)
  const [format, setFormat] = React.useState<OutputFormat>("png")
  const [quality, setQuality] = React.useState(0.85)
  const [blob, setBlob] = React.useState<Blob | null>(null)
  const [busy, setBusy] = React.useState(false)
  const url = useObjectUrl(blob)

  React.useEffect(() => {
    return () => {
      if (image) releaseImages([image])
    }
  }, [image])

  function load(files: File[]) {
    void loadImages(files).then(([img]) => {
      if (!img) return
      setImage(img)
      setWidth(img.width)
      setHeight(img.height)
      setFormat(img.format && img.format !== "avif" ? img.format : "png")
    })
  }

  const ratio = image ? image.width / image.height : 1

  function changeWidth(w: number) {
    setWidth(w)
    if (locked) setHeight(Math.max(1, Math.round(w / ratio)))
  }
  function changeHeight(h: number) {
    setHeight(h)
    if (locked) setWidth(Math.max(1, Math.round(h * ratio)))
  }
  function applyPercent(pct: number) {
    if (!image) return
    setWidth(Math.max(1, Math.round((image.width * pct) / 100)))
    setHeight(Math.max(1, Math.round((image.height * pct) / 100)))
  }
  function applyLongest(px: number) {
    if (!image) return
    const scale = px / Math.max(image.width, image.height)
    setWidth(Math.max(1, Math.round(image.width * scale)))
    setHeight(Math.max(1, Math.round(image.height * scale)))
  }

  React.useEffect(() => {
    if (!image || width < 1 || height < 1) return
    let cancelled = false
    setBusy(true)
    const t = window.setTimeout(async () => {
      try {
        const canvas = toCanvas(image.bitmap, { width, height })
        const out = await encodeCanvas(canvas, format, quality)
        if (!cancelled) setBlob(out)
      } finally {
        if (!cancelled) setBusy(false)
      }
    }, 200)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [image, width, height, format, quality])

  if (!image) return <ImageDropzone onFiles={load} />

  const meta = formatMeta(format)
  const filename = withSuffix(image.name, `-${width}x${height}`, meta.ext)

  return (
    <ToolLayout
      stage={
        <div className="flex flex-col gap-3">
          <Stage checker className="min-h-[24rem]">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="max-h-[70vh] max-w-full object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image.url} alt="" className="max-h-[70vh] max-w-full object-contain opacity-60" />
            )}
          </Stage>
          <p className="text-xs text-muted-foreground tabular-nums">
            Original {image.width} × {image.height} · Output {width} × {height}
          </p>
        </div>
      }
      controls={
        <>
          <ControlSection title="Dimensions">
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <Field label="Width" htmlFor="rs-w">
                <Input
                  id="rs-w"
                  type="number"
                  min={1}
                  value={width}
                  onChange={(e) => changeWidth(Math.max(1, Number(e.target.value) || 1))}
                />
              </Field>
              <Button
                variant="ghost"
                size="icon"
                aria-label={locked ? "Unlock aspect ratio" : "Lock aspect ratio"}
                aria-pressed={locked}
                onClick={() => setLocked((v) => !v)}
                className={cn("mb-0.5", locked ? "text-foreground" : "text-muted-foreground")}
              >
                {locked ? <RiLockLine /> : <RiLockUnlockLine />}
              </Button>
              <Field label="Height" htmlFor="rs-h">
                <Input
                  id="rs-h"
                  type="number"
                  min={1}
                  value={height}
                  onChange={(e) => changeHeight(Math.max(1, Number(e.target.value) || 1))}
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[75, 50, 25].map((p) => (
                <Chip key={p} onClick={() => applyPercent(p)}>
                  {p}%
                </Chip>
              ))}
              {PRESETS.filter((p) => p < Math.max(image.width, image.height)).map((p) => (
                <Chip key={p} onClick={() => applyLongest(p)}>
                  {p} px
                </Chip>
              ))}
            </div>
          </ControlSection>

          <ControlSection title="Output">
            <Field label="Format" htmlFor="rs-format">
              <FormSelect
                id="rs-format"
                value={format}
                onValueChange={setFormat}
                options={FORMATS.map((f) => ({ value: f.value, label: f.label }))}
              />
            </Field>
            {meta.lossy && (
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
          </ControlSection>

          <OutputActions
            blob={blob}
            filename={filename}
            sizeBefore={image.file.size}
            busy={busy}
            onReset={() => {
              setImage(null)
              setBlob(null)
            }}
          />
        </>
      }
    />
  )
}

export function Chip({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 rounded-md px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
        active ? "bg-foreground text-background" : "bg-secondary text-foreground/80 hover:bg-foreground/10 hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}
