"use client"

import * as React from "react"
import { RiCheckLine, RiCloseLine, RiFileCopyLine, RiSipLine } from "@remixicon/react"

import { ControlSection, ImageDropzone, ToolLayout } from "@/components/tools/tool-shell"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { loadImages, releaseImages, type LoadedImage } from "@/lib/tools/image"
import { colorFromRgb, extractPalette, isDark, type PaletteColor, type RGB } from "@/lib/tools/palette"
import { cn } from "@/lib/utils"

export function ColorsTool() {
  const [image, setImage] = React.useState<LoadedImage | null>(null)
  const [count, setCount] = React.useState(8)
  const [palette, setPalette] = React.useState<PaletteColor[]>([])
  const [picked, setPicked] = React.useState<PaletteColor[]>([])
  const [copied, setCopied] = React.useState<string | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    return () => {
      if (image) releaseImages([image])
    }
  }, [image])

  function load(files: File[]) {
    void loadImages(files).then(([img]) => {
      if (!img) return
      setImage(img)
      setPicked([])
    })
  }

  // Draw the image to a canvas so pixels can be sampled on click.
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    canvas.width = image.width
    canvas.height = image.height
    canvas.getContext("2d", { willReadFrequently: true })?.drawImage(image.bitmap, 0, 0)
  }, [image])

  React.useEffect(() => {
    if (!image) return
    setPalette(extractPalette(image.bitmap, count))
  }, [image, count])

  function pick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height)
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data
    const color = colorFromRgb([r, g, b] as RGB)
    setPicked((p) => (p.some((c) => c.hex === color.hex) ? p : [color, ...p].slice(0, 12)))
    void copy(color.hex)
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      window.setTimeout(() => setCopied((c) => (c === text ? null : c)), 1400)
    } catch {
      // Clipboard unavailable (insecure context); ignore.
    }
  }

  function copyCss() {
    const lines = palette.map((c, i) => `  --color-${i + 1}: ${c.hex};`)
    void copy(`:root {\n${lines.join("\n")}\n}`)
  }

  if (!image) return <ImageDropzone onFiles={load} />

  return (
    <ToolLayout
      stage={
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-surface p-3 ring-1 ring-foreground/5">
            <canvas
              ref={canvasRef}
              onClick={pick}
              className="mx-auto block max-h-[60vh] max-w-full cursor-crosshair rounded-lg"
              style={{ aspectRatio: `${image.width} / ${image.height}` }}
            />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RiSipLine className="size-3.5" />
            Click anywhere on the image to pick a colour. Picks are copied automatically.
          </p>

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-medium">Palette</h2>
              <Button variant="ghost" size="xs" onClick={copyCss}>
                <RiFileCopyLine data-icon="inline-start" />
                Copy as CSS
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
              {palette.map((c) => (
                <Swatch key={c.hex} color={c} copied={copied === c.hex} onCopy={() => copy(c.hex)} />
              ))}
            </div>
          </section>

          {picked.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium">Picked</h2>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                {picked.map((c) => (
                  <Swatch
                    key={c.hex}
                    color={c}
                    copied={copied === c.hex}
                    onCopy={() => copy(c.hex)}
                    onRemove={() => setPicked((p) => p.filter((x) => x.hex !== c.hex))}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      }
      controls={
        <>
          <ControlSection title="Palette">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Colours</span>
                <span className="text-muted-foreground tabular-nums">{count}</span>
              </div>
              <Slider
                min={3}
                max={12}
                step={1}
                value={count}
                onValueChange={(v) => setCount(Array.isArray(v) ? v[0] : v)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Colours are grouped by how much of the image they cover, most common first.
            </p>
          </ControlSection>

          <ControlSection title="Details">
            <dl className="grid grid-cols-[4rem_1fr] gap-x-3 gap-y-2 text-xs">
              {palette.slice(0, 6).map((c) => (
                <React.Fragment key={c.hex}>
                  <dt className="flex items-center gap-2">
                    <span className="size-3 rounded-sm ring-1 ring-black/10" style={{ backgroundColor: c.hex }} />
                    <span className="font-mono">{c.hex}</span>
                  </dt>
                  <dd className="text-muted-foreground tabular-nums">
                    rgb({c.rgb.join(", ")}) · hsl({c.hsl[0]}, {c.hsl[1]}%, {c.hsl[2]}%)
                  </dd>
                </React.Fragment>
              ))}
            </dl>
          </ControlSection>

          <Button
            variant="outline"
            onClick={() => {
              setImage(null)
              setPalette([])
              setPicked([])
            }}
          >
            Start over
          </Button>
        </>
      }
    />
  )
}

function Swatch({
  color,
  copied,
  onCopy,
  onRemove,
}: {
  color: PaletteColor
  copied: boolean
  onCopy: () => void
  onRemove?: () => void
}) {
  const dark = isDark(color.rgb)
  return (
    <div className="group/swatch relative">
      <button
        type="button"
        onClick={onCopy}
        title={`Copy ${color.hex}`}
        className={cn(
          "flex aspect-square w-full flex-col items-start justify-end rounded-lg p-2 text-left ring-1 ring-black/10 transition-transform duration-200 ease-out-quart outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring",
          dark ? "text-white/90" : "text-black/80"
        )}
        style={{ backgroundColor: color.hex }}
      >
        <span className="font-mono text-[11px] font-medium">{copied ? "Copied" : color.hex}</span>
        {color.share > 0 && (
          <span className="text-[10px] opacity-70 tabular-nums">{Math.round(color.share * 100)}%</span>
        )}
        {copied && <RiCheckLine className="absolute top-2 right-2 size-3.5" />}
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove colour"
          className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background opacity-0 shadow transition-opacity group-hover/swatch:opacity-100"
        >
          <RiCloseLine className="size-3" />
        </button>
      )}
    </div>
  )
}
