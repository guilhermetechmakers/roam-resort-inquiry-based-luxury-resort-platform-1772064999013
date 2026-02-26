/**
 * Media API: upload via Edge Function, CRUD via Supabase.
 * All responses use null-safe patterns.
 */

import { supabase } from '@/lib/supabase'
import { sanitizeMediaAsset } from '@/lib/cloudinary-service'
import type { MediaAsset, MediaOwnerType, MediaAssetType } from '@/types/media'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export interface UploadMediaPayload {
  file: File
  type: MediaAssetType
  ownerType: MediaOwnerType
  ownerId: string
  altText?: string
  caption?: string
}

export interface UploadMediaResponse {
  success: boolean
  asset?: MediaAsset
  error?: string
}

/** Upload file to Cloudinary and store in media_assets via Edge Function */
export async function uploadMedia(payload: UploadMediaPayload): Promise<UploadMediaResponse> {
  const { file, type, ownerType, ownerId, altText, caption } = payload

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!SUPABASE_URL || !token) {
    return { success: false, error: 'Authentication required' }
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  formData.append('owner_type', ownerType)
  formData.append('owner_id', ownerId)
  if (altText != null) formData.append('alt_text', altText)
  if (caption != null) formData.append('caption', caption)

  const res = await fetch(`${SUPABASE_URL}/functions/v1/media-upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: ANON_KEY,
    },
    body: formData,
  })

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean
    asset?: unknown
    error?: string
  }

  if (!res.ok) {
    return {
      success: false,
      error: json.error ?? 'Upload failed',
    }
  }

  const asset = json.asset ? sanitizeMediaAsset(json.asset) : null
  return {
    success: json.success === true,
    asset: asset ?? undefined,
    error: json.error,
  }
}

/** Get single media asset by ID */
export async function getMedia(id: string): Promise<MediaAsset | null> {
  const { data, error } = await supabase
    .from('media_assets')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !data) return null
  return sanitizeMediaAsset(data)
}

/** List media assets for an entity, ordered by position via relations */
export async function getMediaByEntity(
  entityType: MediaOwnerType,
  entityId: string
): Promise<MediaAsset[]> {
  const { data: relations } = await supabase
    .from('media_asset_relations')
    .select('media_asset_id, position')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('position', { ascending: true })

  const relList = Array.isArray(relations) ? relations : []
  if (relList.length === 0) {
    // Fallback: fetch by owner
    const { data: assets } = await supabase
      .from('media_assets')
      .select('*')
      .eq('owner_type', entityType)
      .eq('owner_id', entityId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
    const list = Array.isArray(assets) ? assets : []
    return list.map((a) => sanitizeMediaAsset(a)).filter((a): a is MediaAsset => a != null)
  }

  const ids = relList.map((r) => (r as { media_asset_id: string }).media_asset_id)
  const { data: assets } = await supabase
    .from('media_assets')
    .select('*')
    .in('id', ids)
    .is('deleted_at', null)

  const assetList = Array.isArray(assets) ? assets : []
  const byId = new Map(assetList.map((a) => [(a as { id: string }).id, sanitizeMediaAsset(a)]))
  return relList
    .map((r) => byId.get((r as { media_asset_id: string }).media_asset_id))
    .filter((a): a is MediaAsset => a != null)
}

/** Soft delete media asset */
export async function deleteMedia(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('media_assets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  return !error
}

/** Update transformations */
export async function updateMediaTransform(
  id: string,
  transformations: Record<string, unknown>
): Promise<MediaAsset | null> {
  const { data, error } = await supabase
    .from('media_assets')
    .update({ transformations, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) return null
  return sanitizeMediaAsset(data)
}

/** Associate media asset with entity and set position */
export async function linkMediaToEntity(
  mediaAssetId: string,
  entityType: MediaOwnerType,
  entityId: string,
  position: number
): Promise<boolean> {
  const { error } = await supabase.from('media_asset_relations').upsert(
    {
      media_asset_id: mediaAssetId,
      entity_type: entityType,
      entity_id: entityId,
      position,
    },
    {
      onConflict: 'media_asset_id,entity_type,entity_id',
    }
  )
  return !error
}

/** Update ordering of media for an entity */
export async function reorderMediaForEntity(
  entityType: MediaOwnerType,
  entityId: string,
  mediaAssetIds: string[]
): Promise<boolean> {
  const updates = mediaAssetIds.map((id, idx) => ({
    media_asset_id: id,
    entity_type: entityType,
    entity_id: entityId,
    position: idx,
  }))

  for (const u of updates) {
    const { error } = await supabase.from('media_asset_relations').upsert(u, {
      onConflict: 'media_asset_id,entity_type,entity_id',
    })
    if (error) return false
  }
  return true
}
