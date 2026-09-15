"use client"

import * as React from "react"
import { RiArrowDownLine, RiArrowUpLine, RiCloseLine, RiFilePdf2Line, RiLoader4Line } from "@remixicon/react"

import { Field } from "@/components/app/field"
import { FormSelect } from "@/components/app/filter-select"
import { ControlSection, ImageDropzone, OutputActions, ToolLayout } from "@/components/tools/tool-shell"
import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/format"
import { loadImages, releaseImages, stripExtension, type LoadedImage } from "@/lib/tools/image"
import { imagesToPdf, type PdfOrientation, type PdfPageSize } from "@/lib/tools/pdf"

const MARGINS = [
  { value: "0", label: "None" },
  { value: "18", label: "Small" },
  { value: "36", label: "Medium" },
  { value: "72", label: "Large" },
]

export function PdfTool() {
  const [images, setImages] = React.useState<LoadedImage[]>([])
  const [pageSize, setPageSize] = React.useState<PdfPageSize>("a4")
  const [orientation, setOrientation] = React.useState<PdfOrientation>("auto")
  const [margin, setMargin] = React.useState("36")
  const [blob, setBlob] = React.useState<Blob | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => () => releaseImages(images), [images])

  function add(files: File[]) {
    void loadImages(files).then((loaded) => {
      setImages((prev) => [...prev, ...loaded])
      setBlob(null)
    })
  }

  function move(index: number, dir: -1 | 1) {
    setImages((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setBlob(null)
  }

  function remove(id: string) {
    setImages((prev) => {
      const gone = prev.find((i) => i.id === id)
      if (gone) releaseImages([gone])
      return prev.filter((i) => i.id !== id)
    })
    setBlob(null)
  }

  async function generate() {
    setBusy(true)
    setError(null)
    try {
      const out = await imagesToPdf(
        images.map((i) => i.file),
        { pageSize, orientation, margin: Number(margin) }
      )
      setBlob(out)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build the PDF")
    } finally {
      setBusy(false)
    }
  }

  if (images.length === 0) {
    return <ImageDropzone multiple onFiles={add} title="Drop images here" hint="One page per image, in this order." />
  }

  const filename = `${images.length === 1 ? stripExtension(images[0].name) : "images"}.pdf`

  return (
    <ToolLayout
      stage={
        <div className="flex flex-col gap-3">
          <ol className="divide-y divide-border/60 rounded-xl bg-surface ring-1 ring-foreground/5">
            {images.map((img, i) => (
              <li key={img.id} className="flex items-center gap-4 px-4 py-3">
                <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="size-12 shrink-0 rounded-md bg-checker object-cover ring-1 ring-foreground/10" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{img.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                    {img.width} × {img.height} · {formatBytes(img.file.size)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center">
                  <Button variant="ghost" size="icon-sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                    <RiArrowUpLine />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Move down" disabled={i === images.length - 1} onClick={() => move(i, 1)}>
                    <RiArrowDownLine />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => remove(img.id)}>
                    <RiCloseLine />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
          <ImageDropzone multiple onFiles={add} title="Add more pages" hint="Drop or click to add." className="min-h-24 py-6" />
        </div>
      }
      controls={
        <>
          <ControlSection title="Pages">
            <Field label="Page size" htmlFor="pdf-size">
              <FormSelect
                id="pdf-size"
                value={pageSize}
                onValueChange={setPageSize}
                options={[
                  { value: "a4", label: "A4" },
                  { value: "letter", label: "US Letter" },
                  { value: "fit", label: "Fit each image" },
                ]}
              />
            </Field>
            {pageSize !== "fit" && (
              <Field label="Orientation" htmlFor="pdf-orient">
                <FormSelect
                  id="pdf-orient"
                  value={orientation}
                  onValueChange={setOrientation}
                  options={[
                    { value: "auto", label: "Match each image" },
                    { value: "portrait", label: "Portrait" },
                    { value: "landscape", label: "Landscape" },
                  ]}
                />
              </Field>
            )}
            <Field label="Margins" htmlFor="pdf-margin">
              <FormSelect id="pdf-margin" value={margin} onValueChange={setMargin} options={MARGINS} />
            </Field>
          </ControlSection>

          <Button onClick={generate} disabled={busy}>
            {busy ? <RiLoader4Line className="animate-spin" data-icon="inline-start" /> : <RiFilePdf2Line data-icon="inline-start" />}
            {blob ? "Rebuild PDF" : "Build PDF"}
          </Button>
          {error && <p className="text-xs text-destructive">{error}</p>}

          {blob && (
            <OutputActions
              blob={blob}
              filename={filename}
              onReset={() => {
                setImages([])
                setBlob(null)
              }}
            />
          )}
        </>
      }
    />
  )
}
