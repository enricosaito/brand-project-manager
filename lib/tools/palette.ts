"use client"

export type RGB = [number, number, number]

export interface PaletteColor {
  hex: string
  rgb: RGB
  hsl: [number, number, number]
  /** Share of sampled pixels that fell into this colour's bucket (0–1). */
  share: number
}

export function rgbToHex([r, g, b]: RGB) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase()
}

export function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)]
}

/** Relative luminance, for choosing readable text on a swatch. */
export function isDark([r, g, b]: RGB) {
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) < 0.4
}

export function colorFromRgb(rgb: RGB, share = 0): PaletteColor {
  return { hex: rgbToHex(rgb), rgb, hsl: rgbToHsl(rgb), share }
}

/**
 * Median-cut quantisation over a downscaled copy of the image.
 * Returns up to `count` colours ordered by how much of the image they cover.
 */
export function extractPalette(source: ImageBitmap | HTMLCanvasElement, count = 8): PaletteColor[] {
  const maxSide = 160
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height))
  const w = Math.max(1, Math.round(source.width * scale))
  const h = Math.max(1, Math.round(source.height * scale))
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return []
  ctx.drawImage(source, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)

  const pixels: RGB[] = []
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    pixels.push([data[i], data[i + 1], data[i + 2]])
  }
  if (pixels.length === 0) return []

  type Box = RGB[]
  let boxes: Box[] = [pixels]

  const rangeOf = (box: Box) => {
    const min: RGB = [255, 255, 255]
    const max: RGB = [0, 0, 0]
    for (const p of box) {
      for (let c = 0; c < 3; c++) {
        if (p[c] < min[c]) min[c] = p[c]
        if (p[c] > max[c]) max[c] = p[c]
      }
    }
    const ranges = [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
    const channel = ranges.indexOf(Math.max(...ranges))
    return { channel, spread: ranges[channel] }
  }

  while (boxes.length < count) {
    // Split the box with the widest colour range.
    let target = -1
    let widest = -1
    boxes.forEach((box, i) => {
      if (box.length < 2) return
      const { spread } = rangeOf(box)
      if (spread > widest) {
        widest = spread
        target = i
      }
    })
    if (target === -1 || widest === 0) break
    const box = boxes[target]
    const { channel } = rangeOf(box)
    box.sort((a, b) => a[channel] - b[channel])
    const mid = Math.floor(box.length / 2)
    boxes.splice(target, 1, box.slice(0, mid), box.slice(mid))
  }

  const total = pixels.length
  const colors = boxes
    .map((box) => {
      const sum = box.reduce<RGB>((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0])
      const avg: RGB = [
        Math.round(sum[0] / box.length),
        Math.round(sum[1] / box.length),
        Math.round(sum[2] / box.length),
      ]
      return colorFromRgb(avg, box.length / total)
    })
    .sort((a, b) => b.share - a.share)

  // Merge near-identical results so the palette reads as distinct colours.
  const merged: PaletteColor[] = []
  for (const c of colors) {
    const twin = merged.find((m) => distance(m.rgb, c.rgb) < 12)
    if (twin) twin.share += c.share
    else merged.push({ ...c })
  }
  return merged.sort((a, b) => b.share - a.share)
}

function distance(a: RGB, b: RGB) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)
}
