/**
 * Media Asset types for Roam Resort.
 * All arrays use null-safe defaults; API responses should be validated.
 */

export type MediaAssetType =
  | 'listing_hero'
  | 'listing_gallery'
  | 'host_avatar'
  | 'editorial_hero'
  | 'editorial_gallery'

export type MediaOwnerType = 'listing' | 'host' | 'editorial'

export interface MediaAsset {
  id: string
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  bytes: number
  resource_type: string
  type: MediaAssetType
  owner_type: MediaOwnerType
  owner_id: string
  caption: string | null
  alt_text: string | null
  focal_point_x: number | null
  focal_point_y: number | null
  transformations: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface MediaAssetRelation {
  id: string
  media_asset_id: string
  entity_type: 'listing' | 'host' | 'editorial'
  entity_id: string
  position: number
  created_at: string
}

export interface CropGeometry {
  x: number
  y: number
  width: number
  height: number
  aspectRatio?: number | string
}

export interface MediaUploadPayload {
  type: MediaAssetType
  owner_id: string
  alt_text?: string
  caption?: string
  crop?: CropGeometry
  transformations?: Record<string, unknown>
}

export interface MediaCropPayload {
  asset_id: string
  crop: CropGeometry
  transformations?: Record<string, unknown>
}

/** Aspect ratio presets for ImageCropper */
export const ASPECT_RATIO_PRESETS = {
  listing_hero: 16 / 9,
  gallery: 4 / 3,
  avatar: 1,
  editorial_banner: 1600 / 420,
} as const
