/**
 * Cloudinary URL transformation utilities.
 * Build transformation URLs for width, height, crop, quality.
 * See: https://cloudinary.com/documentation/image_transformations
 */

/** Check if Cloudinary upload should be attempted (Supabase + optional flag) */
export function isCloudinaryConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL ?? ''
  const enabled = import.meta.env.VITE_CLOUDINARY_ENABLED ?? 'true'
  return Boolean(url && enabled !== 'false')
}

export interface CloudinaryTransformOptions {
  width?: number
  height?: number
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'crop' | 'limit'
  quality?: number | 'auto'
  fetchFormat?: 'auto' | 'webp' | 'jpg' | 'png'
}

/**
 * Check if URL is a Cloudinary URL.
 */
export function isCloudinaryUrl(url: string): boolean {
  return (
    typeof url === 'string' &&
    (url.includes('res.cloudinary.com') || url.includes('cloudinary.com'))
  )
}

/**
 * Extract public_id from Cloudinary URL if possible.
 * Format: https://res.cloudinary.com/{cloud}/{type}/upload/{params}/{public_id}.{ext}
 */
export function getPublicIdFromUrl(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null
  try {
    const match = url.match(/\/upload\/(?:[^/]+\/)*v\d+\/(.+)\.\w+$/)
    return match ? match[1].replace(/\//g, '/') : null
  } catch {
    return null
  }
}

/**
 * Build Cloudinary transformation URL.
 * For URLs with public_id or full Cloudinary URLs.
 */
export function cloudinaryUrl(
  urlOrPublicId: string,
  options: CloudinaryTransformOptions = {}
): string {
  if (!urlOrPublicId?.trim()) return ''

  const { width, height, crop = 'fill', quality = 'auto', fetchFormat = 'auto' } = options

  if (!isCloudinaryUrl(urlOrPublicId)) {
    return urlOrPublicId
  }

  const parts: string[] = []
  if (width) parts.push(`w_${width}`)
  if (height) parts.push(`h_${height}`)
  parts.push(`c_${crop}`)
  parts.push(`q_${quality}`)
  parts.push(`f_${fetchFormat}`)

  const transform = parts.join(',')
  const uploadIdx = urlOrPublicId.indexOf('/upload/')
  if (uploadIdx < 0) return urlOrPublicId
  const insertPos = uploadIdx + 8
  return `${urlOrPublicId.slice(0, insertPos)}${transform}/${urlOrPublicId.slice(insertPos)}`
}

/**
 * Thumbnail URL (e.g. for gallery grid): 400x300 fill
 */
export function cloudinaryThumbUrl(url: string): string {
  return cloudinaryUrl(url, { width: 400, height: 300, crop: 'fill' })
}

/**
 * Hero/large URL: 1200x800 fill
 */
export function cloudinaryHeroUrl(url: string): string {
  return cloudinaryUrl(url, { width: 1200, height: 800, crop: 'fill' })
}
