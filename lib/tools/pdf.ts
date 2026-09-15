"use client"

import { PDFDocument, PageSizes } from "pdf-lib"

import { encodeCanvas, loadBitmap, toCanvas } from "./image"

export type PdfPageSize = "fit" | "a4" | "letter"
export type PdfOrientation = "auto" | "portrait" | "landscape"

export interface PdfOptions {
  pageSize: PdfPageSize
  orientation: PdfOrientation
  /** Margin in points (1/72 in). */
  margin: number
}

const PX_TO_PT = 0.75

/**
 * Builds a PDF with one image per page. Images are re-encoded through a
 * canvas so any browser-decodable format (WebP, AVIF, HEIC where supported)
 * can be embedded as PNG or JPEG.
 */
export async function imagesToPdf(files: File[], options: PdfOptions): Promise<Blob> {
  const doc = await PDFDocument.create()

  for (const file of files) {
    const bitmap = await loadBitmap(file)
    const keepPng = file.type === "image/png"
    const canvas = toCanvas(bitmap)
    const encoded = await encodeCanvas(canvas, keepPng ? "png" : "jpeg", 0.92)
    const bytes = new Uint8Array(await encoded.arrayBuffer())
    const image = keepPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes)
    bitmap.close()

    const imgW = image.width
    const imgH = image.height
    const landscape =
      options.orientation === "landscape" ||
      (options.orientation === "auto" && imgW > imgH)

    let pageW: number
    let pageH: number
    if (options.pageSize === "fit") {
      pageW = imgW * PX_TO_PT + options.margin * 2
      pageH = imgH * PX_TO_PT + options.margin * 2
    } else {
      const [w, h] = options.pageSize === "a4" ? PageSizes.A4 : PageSizes.Letter
      pageW = landscape ? Math.max(w, h) : Math.min(w, h)
      pageH = landscape ? Math.min(w, h) : Math.max(w, h)
    }

    const page = doc.addPage([pageW, pageH])
    const boxW = pageW - options.margin * 2
    const boxH = pageH - options.margin * 2
    const scale = Math.min(boxW / imgW, boxH / imgH)
    const drawW = imgW * scale
    const drawH = imgH * scale
    page.drawImage(image, {
      x: (pageW - drawW) / 2,
      y: (pageH - drawH) / 2,
      width: drawW,
      height: drawH,
    })
  }

  const pdfBytes = await doc.save()
  return new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
}
