/*
 * Meal photos.
 *
 * Photos are stored inside AppData as small JPEG data URLs rather than in a
 * separate blob store. That is a deliberate trade: it costs storage quota, but
 * it means photos are encrypted by app lock, included in export, and wiped by
 * delete — all for free. A separate IndexedDB store would have left them
 * sitting in the clear beside an encrypted vault, which is worse than useless.
 *
 * The aggressive downscale keeps a meal photo around 20-40 KB, which is both
 * enough for a vision model to identify food and small enough that a few
 * hundred meals still fit.
 */

const MAX_EDGE_PX = 512
const JPEG_QUALITY = 0.6

/** Rough byte count of a data URL, for the storage warning. */
export function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  // 4 base64 chars encode 3 bytes.
  return Math.round((base64.length * 3) / 4)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Downscales a captured photo to a compact JPEG data URL.
 *
 * `imageOrientation: 'from-image'` matters: phone cameras record rotation in
 * EXIF, and without it portrait photos come out sideways.
 */
export async function fileToThumbnail(
  file: File,
  maxEdge = MAX_EDGE_PX,
  quality = JPEG_QUALITY,
): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas unavailable')

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', quality)
}

/** Splits a data URL into the media type and bare base64 an API expects. */
export function splitDataUrl(dataUrl: string): { mediaType: string; base64: string } {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl)
  if (!match) throw new Error('Not a base64 data URL')
  return { mediaType: match[1], base64: match[2] }
}
