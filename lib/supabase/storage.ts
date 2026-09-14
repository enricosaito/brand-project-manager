"use client"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { AssetType } from "@/lib/types"

export const ASSETS_BUCKET = "assets"

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif", "svg", "heic", "tif", "tiff"])
const VIDEO_EXT = new Set(["mp4", "mov", "webm", "m4v", "mkv"])
const DESIGN_EXT = new Set(["fig", "sketch", "ai", "psd", "xd", "afdesign", "afphoto", "indd", "eps"])
const PRESENTATION_EXT = new Set(["key", "ppt", "pptx", "odp"])

export function extensionOf(fileName: string) {
  const idx = fileName.lastIndexOf(".")
  return idx === -1 ? "" : fileName.slice(idx + 1).toLowerCase()
}

export function assetTypeFor(file: File): AssetType {
  const ext = extensionOf(file.name)
  if (file.type.startsWith("image/") || IMAGE_EXT.has(ext)) return "image"
  if (file.type.startsWith("video/") || VIDEO_EXT.has(ext)) return "video"
  if (DESIGN_EXT.has(ext)) return "design"
  if (PRESENTATION_EXT.has(ext)) return "presentation"
  return "document"
}

export interface MediaProbe {
  width?: number
  height?: number
  duration?: number
  /** JPEG poster for videos, generated in the browser. */
  poster?: Blob
}

/** Reads dimensions (and a poster frame for videos) without uploading. */
export async function probeMedia(file: File, type: AssetType): Promise<MediaProbe> {
  if (type === "image") {
    try {
      const bitmap = await createImageBitmap(file)
      const probe = { width: bitmap.width, height: bitmap.height }
      bitmap.close()
      return probe
    } catch {
      return {}
    }
  }

  if (type === "video") {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file)
      const video = document.createElement("video")
      video.preload = "metadata"
      video.muted = true
      video.playsInline = true
      const done = (probe: MediaProbe) => {
        URL.revokeObjectURL(url)
        resolve(probe)
      }
      video.onerror = () => done({})
      video.onloadedmetadata = () => {
        const base = {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: Math.round(video.duration),
        }
        // Seek a little way in so the poster is not a black first frame.
        video.currentTime = Math.min(1, video.duration / 2)
        video.onseeked = () => {
          try {
            const canvas = document.createElement("canvas")
            const scale = Math.min(1, 1280 / Math.max(1, video.videoWidth))
            canvas.width = Math.round(video.videoWidth * scale)
            canvas.height = Math.round(video.videoHeight * scale)
            canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height)
            canvas.toBlob(
              (blob) => done({ ...base, poster: blob ?? undefined }),
              "image/jpeg",
              0.82
            )
          } catch {
            done(base)
          }
        }
      }
      video.src = url
    })
  }

  return {}
}

export interface UploadedFile {
  storagePath: string
  publicUrl: string
}

/** Uploads a blob to the assets bucket and returns its public URL. */
export async function uploadToBucket(
  supabase: SupabaseClient,
  path: string,
  body: Blob,
  contentType?: string
): Promise<UploadedFile> {
  const { error } = await supabase.storage
    .from(ASSETS_BUCKET)
    .upload(path, body, { contentType, upsert: false, cacheControl: "31536000" })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from(ASSETS_BUCKET).getPublicUrl(path)
  return { storagePath: path, publicUrl: data.publicUrl }
}

export function assetObjectPath(workspaceId: string, projectId: string, assetId: string, ext: string) {
  return `${workspaceId}/${projectId}/${assetId}${ext ? `.${ext}` : ""}`
}

/** Poster frame for a video lives next to the video itself. */
export function posterPathFor(storagePath: string) {
  return `${storagePath}.poster.jpg`
}

/** Every object that belongs to an asset (file + poster when it is a video). */
export function objectPathsFor(asset: { storagePath?: string; type: AssetType }) {
  if (!asset.storagePath) return []
  return asset.type === "video"
    ? [asset.storagePath, posterPathFor(asset.storagePath)]
    : [asset.storagePath]
}

export function coverObjectPath(workspaceId: string, id: string, ext: string) {
  return `${workspaceId}/covers/${id}${ext ? `.${ext}` : ""}`
}
