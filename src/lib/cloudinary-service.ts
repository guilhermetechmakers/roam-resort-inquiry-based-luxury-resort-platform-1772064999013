/**
 * Cloudinary Integration Layer
 * Direct upload, transformation presets, srcset generation, and CDN delivery.
 * All operations guard against null/undefined.
 */

import type { MediaAsset } from '@/types/media'

export type MediaAssetType =
  | 'listing_hero'
  | 'listing_gallery'
  | 'host_avatar'
  | 'editorial_hero'
  | 'editorial_gallery'

export interface CloudinaryTransformOptions {
  width?: number
  height?: number
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'crop' | 'limit' | 'pad'
  quality?: number | 'auto'
  fetchFormat?: 'auto' | 'webp' | 'jpg' | 'png'
  gravity?: 'auto' | 'face' | 'center'
  aspectRatio?: string
}

export interface SrcSetEntry {
  url: string
  width: number
  descriptor?: string
}

/** Default widths for responsive srcset */
const SRCSET_WIDTHS = [320, 480, 768, 1024, 1400] as const

/** Transformation presets per spec */
export const TRANSFORMATION_PRESETS = {
  hero_large: {
    width: 1400,
    height: 800,
    crop: 'fill' as const,
    quality: 'auto' as const,
    fetchFormat: 'auto' as const,
    gravity: 'auto' as const,
  },
  gallery_thumb: {
    width: 480,
    height: 360,
    crop: 'fill' as const,
    quality: 'auto' as const,
    fetchFormat: 'auto' as const,
  },
  listing_avatar: {
    width: 200,
    height: 200,
    crop: 'fill' as const,
    quality: 'auto' as const,
    fetchFormat: 'auto' as const,
  },
  editorial_banner: {
    width: 1600,
    height: 420,
    crop: 'fill' as const,
    quality: 'auto' as const,
    fetchFormat: 'auto' as const,
  },
} as const

/** Check if URL is Cloudinary */
export function isCloudinaryUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  return url.includes('res.cloudinary.com') || url.includes('cloudinary.com')
}

/** Extract public_id from Cloudinary URL */
export function getPublicIdFromUrl(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null
  try {
    const match = url.match(/\/upload\/(?:[^/]+\/)*v\d+\/(.+)\.\w+$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/** Build Cloudinary transformation string from options */
function buildTransformString(options: CloudinaryTransformOptions): string {
  const parts: string[] = []
  if (options.width) parts.push(`w_${options.width}`)
  if (options.height) parts.push(`h_${options.height}`)
  if (options.crop) parts.push(`c_${options.crop}`)
  if (options.quality) parts.push(`q_${options.quality}`)
  if (options.fetchFormat) parts.push(`f_${options.fetchFormat}`)
  if (options.gravity) parts.push(`g_${options.gravity}`)
  if (options.aspectRatio) parts.push(`ar_${options.aspectRatio}`)
  return parts.filter(Boolean).join(',')
}

/** Insert transformation into Cloudinary URL */
export function cloudinaryTransformUrl(
  urlOrPublicId: string,
  options: CloudinaryTransformOptions = {}
): string {
  if (!urlOrPublicId?.trim()) return ''

  if (!isCloudinaryUrl(urlOrPublicId)) {
    return urlOrPublicId
  }

  const transform = buildTransformString(options)
  if (!transform) return urlOrPublicId

  const uploadIdx = urlOrPublicId.indexOf('/upload/')
  if (uploadIdx < 0) return urlOrPublicId
  const insertPos = uploadIdx + 8
  return `${urlOrPublicId.slice(0, insertPos)}${transform}/${urlOrPublicId.slice(insertPos)}`
}

/** Get URL for a preset by name */
export function getPresetUrl(
  urlOrPublicId: string,
  preset: keyof typeof TRANSFORMATION_PRESETS
): string {
  const opts = TRANSFORMATION_PRESETS[preset]
  return cloudinaryTransformUrl(urlOrPublicId, opts)
}

/** Generate responsive srcset for an image */
export function generateSrcSet(
  urlOrPublicId: string,
  options: { sizes?: number[]; dpr?: boolean } = {}
): SrcSetEntry[] {
  if (!urlOrPublicId?.trim()) return []

  const widths = options.sizes ?? [...SRCSET_WIDTHS]
  const entries: SrcSetEntry[] = []

  for (const w of widths) {
    const url = cloudinaryTransformUrl(urlOrPublicId, {
      width: w,
      crop: 'fill',
      quality: 'auto',
      fetchFormat: 'auto',
    })
    if (url) {
      entries.push({ url, width: w, descriptor: `${w}w` })
    }
    if (options.dpr) {
      const url2x = cloudinaryTransformUrl(urlOrPublicId, {
        width: w * 2,
        crop: 'fill',
        quality: 'auto',
        fetchFormat: 'auto',
      })
      if (url2x) {
        entries.push({ url: url2x, width: w * 2, descriptor: `${w}w` })
      }
    }
  }

  return entries
}

/** Build srcset attribute value */
export function buildSrcSetAttribute(entries: SrcSetEntry[]): string {
  const list = Array.isArray(entries) ? entries : []
  return list
    .filter((e) => e?.url && e?.descriptor)
    .map((e) => `${e.url} ${e.descriptor}`)
    .join(', ')
}

/** Build sizes attribute hint for responsive images */
export function buildSizesAttribute(
  breakpoints: { maxWidth: number; size: string }[] = []
): string {
  const defaults = [
    { maxWidth: 640, size: '100vw' },
    { maxWidth: 1024, size: '50vw' },
    { maxWidth: 1400, size: '33vw' },
  ]
  const list = breakpoints.length > 0 ? breakpoints : defaults
  return list.map((b) => `(max-width: ${b.maxWidth}px) ${b.size}`).join(', ') + ', 33vw'
}

/** Convenience: build srcset string from URL */
export function buildSrcset(
  url: string,
  options: { widths?: number[] } = {}
): string {
  const entries = generateSrcSet(url, { sizes: options.widths ?? [...SRCSET_WIDTHS] })
  return buildSrcSetAttribute(entries)
}

/** Get sizes hint by preset name */
export function getSizesHint(
  preset: 'hero' | 'gallery' | 'avatar' = 'gallery'
): string {
  const presets: Record<string, { maxWidth: number; size: string }[]> = {
    hero: [
      { maxWidth: 640, size: '100vw' },
      { maxWidth: 1400, size: '1400px' },
    ],
    gallery: [
      { maxWidth: 640, size: '100vw' },
      { maxWidth: 1024, size: '50vw' },
      { maxWidth: 1400, size: '33vw' },
    ],
    avatar: [
      { maxWidth: 640, size: '200px' },
      { maxWidth: 1024, size: '200px' },
    ],
  }
  return buildSizesAttribute(presets[preset] ?? presets.gallery)
}

/** Safe asset metadata with defaults */
export interface CloudinaryAssetMetadata {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  bytes: number
  resource_type: string
}

/** Sanitize MediaAsset from API; ensure safe defaults */
export function sanitizeMediaAsset(raw: unknown): MediaAsset | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const id = r.id as string | undefined
  const publicId = r.public_id as string | undefined
  const secureUrl = r.secure_url as string | undefined
  if (!id || !publicId || !secureUrl) return null

  return {
    id: String(id),
    public_id: String(publicId),
    secure_url: String(secureUrl),
    width: Number(r.width) || 0,
    height: Number(r.height) || 0,
    format: String(r.format ?? 'image'),
    bytes: Number(r.bytes) || 0,
    resource_type: String(r.resource_type ?? 'image'),
    type: (r.type as MediaAsset['type']) ?? 'listing_gallery',
    owner_type: (r.owner_type as MediaAsset['owner_type']) ?? 'listing',
    owner_id: String(r.owner_id ?? ''),
    caption: (r.caption as string | null) ?? null,
    alt_text: (r.alt_text as string | null) ?? null,
    focal_point_x: r.focal_point_x != null ? Number(r.focal_point_x) : null,
    focal_point_y: r.focal_point_y != null ? Number(r.focal_point_y) : null,
    transformations:
      r.transformations && typeof r.transformations === 'object'
        ? (r.transformations as Record<string, unknown>)
        : null,
    created_at: String(r.created_at ?? ''),
    updated_at: String(r.updated_at ?? ''),
  }
}

export function normalizeAssetMetadata(raw: unknown): CloudinaryAssetMetadata {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    public_id: String(obj.public_id ?? ''),
    secure_url: String(obj.secure_url ?? obj.url ?? ''),
    width: Number(obj.width) || 0,
    height: Number(obj.height) || 0,
    format: String(obj.format ?? 'jpg'),
    bytes: Number(obj.bytes) || 0,
    resource_type: String(obj.resource_type ?? 'image'),
  }
}
