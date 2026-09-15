"use client"

import * as React from "react"

import { Field } from "@/components/app/field"
import { FormSelect } from "@/components/app/filter-select"
import { Chip } from "@/components/tools/resize-tool"
import {
  ControlSection,
  ImageDropzone,
  OutputActions,
  ToolLayout,
} from "@/components/tools/tool-shell"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  encodeCanvas,
  FORMATS,
  formatMeta,
  loadImages,
  releaseImages,
  withSuffix,
  type LoadedImage,
  type OutputFormat,
} from "@/lib/tools/image"
import { cn } from "@/lib/utils"

interface Preset {
  id: string
  group: string
  label: string
  ratio: number | null
  width?: number
  height?: number
}

const PRESETS: Preset[] = [
  { id: "ig-post", group: "Instagram", label: "Post · 1:1", ratio: 1, width: 1080, height: 1080 },
  { id: "ig-portrait", group: "Instagram", label: "Portrait · 4:5", ratio: 4 / 5, width: 1080, height: 1350 },
  { id: "ig-story", group: "Instagram · TikTok", label: "Story / Reel · 9:16", ratio: 9 / 16, width: 1080, height: 1920 },
  { id: "yt-thumb", group: "YouTube", label: "Thumbnail · 16:9", ratio: 16 / 9, width: 1280, height: 720 },
  { id: "x-post", group: "X", label: "Post · 16:9", ratio: 16 / 9, width: 1600, height: 900 },
  { id: "x-header", group: "X", label: "Header · 3:1", ratio: 3, width: 1500, height: 500 },
  { id: "li-post", group: "LinkedIn", label: "Post · 1.91:1", ratio: 1.91, width: 1200, height: 628 },
  { id: "li-banner", group: "LinkedIn", label: "Banner · 4:1", ratio: 4, width: 1584, height: 396 },
  { id: "fb-cover", group: "Facebook", label: "Cover · 2.63:1", ratio: 820 / 312, width: 820, height: 312 },
  { id: "pin", group: "Pinterest", label: "Pin · 2:3", ratio: 2 / 3, width: 1000, height: 1500 },
  { id: "r-1-1", group: "Ratios", label: "Square · 1:1", ratio: 1 },
  { id: "r-4-3", group: "Ratios", label: "4:3", ratio: 4 / 3 },
  { id: "r-3-2", group: "Ratios", label: "3:2", ratio: 3 / 2 },
  { id: "r-16-9", group: "Ratios", label: "16:9", ratio: 16 / 9 },
  { id: "r-2-3", group: "Ratios", label: "2:3", ratio: 2 / 3 },
  { id: "free", group: "Ratios", label: "Free", ratio: null },
]

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

type Handle = "nw" | "ne" | "sw" | "se"
const MIN = 32

function fitRect(imgW: number, imgH: number, ratio: number | null): Rect {
  if (!ratio) return { x: 0, y: 0, w: imgW, h: imgH }
  let w = imgW
  let h = w / ratio
  if (h > imgH) {
    h = imgH
    w = h * ratio
  }
  return { x: (imgW - w) / 2, y: (imgH - h) / 2, w, h }
}

export function CropTool() {
  const [image, setImage] = React.useState<LoadedImage | null>(null)
  const [presetId, setPresetId] = React.useState("ig-post")
  const [rect, setRect] = React.useState<Rect>({ x: 0, y: 0, w: 0, h: 0 })
  const [useTarget, setUseTarget] = React.useState(true)
  const [format, setFormat] = React.useState<OutputFormat>("jpeg")
  const [quality, setQuality] = React.useState(0.9)
  const [blob, setBlob] = React.useState<Blob | null>(null)
  const [busy, setBusy] = React.useState(false)
  const frameRef = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = React.useState(1)

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]

  React.useEffect(() => {
    return () => {
      if (image) releaseImages([image])
    }
  }, [image])

  function load(files: File[]) {
    void loadImages(files).then(([img]) => {
      if (!img) return
      setImage(img)
      setRect(fitRect(img.width, img.height, preset.ratio))
      setFormat(img.format === "png" ? "png" : "jpeg")
    })
  }

  // Reset the frame when the preset changes.
  React.useEffect(() => {
    if (image) setRect(fitRect(image.width, image.height, preset.ratio))
  }, [preset, image])

  // Track the on-screen scale of the image.
  React.useEffect(() => {
    const el = frameRef.current
    if (!el || !image) return
    const update = () => setScale(el.clientWidth / image.width)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [image])

  /* ------------------------------------------------------- interaction */
  const drag = React.useRef<{
    mode: "move" | Handle
    startX: number
    startY: number
    start: Rect
  } | null>(null)

  function onPointerDown(e: React.PointerEvent, mode: "move" | Handle) {
    e.preventDefault()
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { mode, startX: e.clientX, startY: e.clientY, start: rect }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !image) return
    const dx = (e.clientX - drag.current.startX) / scale
    const dy = (e.clientY - drag.current.startY) / scale
    const s = drag.current.start
    const W = image.width
    const H = image.height

    if (drag.current.mode === "move") {
      const x = Math.min(Math.max(0, s.x + dx), W - s.w)
      const y = Math.min(Math.max(0, s.y + dy), H - s.h)
      setRect({ ...s, x, y })
      return
    }

    const handle = drag.current.mode
    const ratio = preset.ratio
    // Anchor is the opposite corner.
    const anchorX = handle.includes("w") ? s.x + s.w : s.x
    const anchorY = handle.includes("n") ? s.y + s.h : s.y
    const signX = handle.includes("w") ? -1 : 1
    const signY = handle.includes("n") ? -1 : 1

    let w = Math.max(MIN, s.w + dx * signX)
    let h = Math.max(MIN, s.h + dy * signY)
    if (ratio) {
      // Follow the dominant axis of the drag, keep the ratio.
      if (Math.abs(dx) >= Math.abs(dy)) h = w / ratio
      else w = h * ratio
    }
    // Clamp to image bounds relative to the anchor.
    const maxW = signX > 0 ? W - anchorX : anchorX
    const maxH = signY > 0 ? H - anchorY : anchorY
    if (w > maxW) {
      w = maxW
      if (ratio) h = w / ratio
    }
    if (h > maxH) {
      h = maxH
      if (ratio) w = h * ratio
    }
    const x = signX > 0 ? anchorX : anchorX - w
    const y = signY > 0 ? anchorY : anchorY - h
    setRect({ x, y, w, h })
  }

  function onPointerUp() {
    drag.current = null
  }

  /* ------------------------------------------------------------ output */
  React.useEffect(() => {
    if (!image || rect.w < 1 || rect.h < 1) return
    let cancelled = false
    setBusy(true)
    const t = window.setTimeout(async () => {
      try {
        const outW = useTarget && preset.width ? preset.width : Math.round(rect.w)
        const outH = useTarget && preset.height ? preset.height : Math.round(rect.h)
        const canvas = document.createElement("canvas")
        canvas.width = outW
        canvas.height = outH
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(image.bitmap, rect.x, rect.y, rect.w, rect.h, 0, 0, outW, outH)
        const out = await encodeCanvas(canvas, format, quality)
        if (!cancelled) setBlob(out)
      } finally {
        if (!cancelled) setBusy(false)
      }
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [image, rect, useTarget, preset, format, quality])

  if (!image) return <ImageDropzone onFiles={load} />

  const meta = formatMeta(format)
  const outW = useTarget && preset.width ? preset.width : Math.round(rect.w)
  const outH = useTarget && preset.height ? preset.height : Math.round(rect.h)
  const filename = withSuffix(image.name, `-${preset.id}`, meta.ext)
  const groups = Array.from(new Set(PRESETS.map((p) => p.group)))

  return (
    <ToolLayout
      stage={
        <div className="flex flex-col gap-3">
          <div className="rounded-xl bg-surface p-3 ring-1 ring-foreground/5">
            <div
              ref={frameRef}
              className="relative mx-auto w-full max-w-[880px] touch-none select-none overflow-hidden rounded-lg bg-checker"
              style={{ aspectRatio: `${image.width} / ${image.height}` }}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="block h-full w-full" draggable={false} />
              {/* Crop frame */}
              <div
                role="presentation"
                onPointerDown={(e) => onPointerDown(e, "move")}
                className="absolute cursor-move shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] ring-1 ring-white/90"
                style={{
                  left: rect.x * scale,
                  top: rect.y * scale,
                  width: rect.w * scale,
                  height: rect.h * scale,
                }}
              >
                {/* thirds */}
                <div className="pointer-events-none absolute inset-0 opacity-60">
                  <div className="absolute inset-y-0 left-1/3 w-px bg-white/70" />
                  <div className="absolute inset-y-0 left-2/3 w-px bg-white/70" />
                  <div className="absolute inset-x-0 top-1/3 h-px bg-white/70" />
                  <div className="absolute inset-x-0 top-2/3 h-px bg-white/70" />
                </div>
                {(["nw", "ne", "sw", "se"] as Handle[]).map((h) => (
                  <div
                    key={h}
                    onPointerDown={(e) => onPointerDown(e, h)}
                    className={cn(
                      "absolute size-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] ring-1 ring-black/10",
                      h === "nw" && "-top-2 -left-2 cursor-nwse-resize",
                      h === "ne" && "-top-2 -right-2 cursor-nesw-resize",
                      h === "sw" && "-bottom-2 -left-2 cursor-nesw-resize",
                      h === "se" && "-right-2 -bottom-2 cursor-nwse-resize"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            Selection {Math.round(rect.w)} × {Math.round(rect.h)} · Output {outW} × {outH}
            {preset.ratio ? ` · ${preset.label}` : ""}
          </p>
        </div>
      }
      controls={
        <>
          <ControlSection title="Format">
            <div className="flex flex-col gap-3">
              {groups.map((g) => (
                <div key={g}>
                  <div className="mb-1.5 text-[11px] font-medium text-muted-foreground">{g}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS.filter((p) => p.group === g).map((p) => (
                      <Chip key={p.id} active={p.id === presetId} onClick={() => setPresetId(p.id)}>
                        {p.label}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ControlSection>

          <ControlSection title="Output">
            {preset.width && (
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>
                  Export at {preset.width} × {preset.height}
                </span>
                <Switch checked={useTarget} onCheckedChange={setUseTarget} />
              </label>
            )}
            <Field label="File type" htmlFor="crop-format">
              <FormSelect
                id="crop-format"
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
