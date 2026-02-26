/**
 * AssetPreview - renders Cloudinary-transformed URLs with responsive srcset.
 */

import {
  getPresetUrl,
  buildSrcset,
  getSizesHint,
  isCloudinaryUrl,
} from '@/lib/cloudinary-service'
import type { MediaAsset } from '@/types/media'
import { cn } from '@/lib/utils'

export interface AssetPreviewProps {
  asset: MediaAsset | { secure_url: string; public_id?: string; alt_text?: string | null }
  preset?: 'hero_large' | 'gallery_thumb' | 'listing_avatar' | 'editorial_banner'
  sizes?: 'hero' | 'gallery' | 'avatar'
  className?: string
  aspectRatio?: 'video' | 'square' | 'auto'
}

const PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="%23e5e7eb"%3E%3Crect width="400" height="300"/%3E%3C/svg%3E'

export function AssetPreview({
  asset,
  preset = 'gallery_thumb',
  sizes = 'gallery',
  className,
  aspectRatio = 'auto',
}: AssetPreviewProps) {
  const url = asset?.secure_url ?? ''
  const alt = (asset?.alt_text ?? '') || 'Image'

  const srcset = isCloudinaryUrl(url) ? buildSrcset(url, { widths: [320, 480, 768, 1024, 1400] }) : undefined
  const sizesAttr = getSizesHint(sizes)

  if (!url) {
    return (
      <div
        className={cn(
          'bg-muted flex items-center justify-center',
          aspectRatio === 'video' && 'aspect-video',
          aspectRatio === 'square' && 'aspect-square',
          className
        )}
        role="img"
        aria-label={alt || 'Placeholder'}
      >
        <span className="text-muted-foreground text-sm">No image</span>
      </div>
    )
  }

  return (
    <img
      src={url ? (isCloudinaryUrl(url) ? getPresetUrl(url, preset) : url) : PLACEHOLDER}
      srcSet={srcset}
      sizes={srcset ? sizesAttr : undefined}
      alt={alt}
      className={cn(
        'object-cover',
        aspectRatio === 'video' && 'aspect-video',
        aspectRatio === 'square' && 'aspect-square',
        className
      )}
      loading="lazy"
      onError={(e) => {
        ;(e.target as HTMLImageElement).src = PLACEHOLDER
      }}
    />
  )
}
