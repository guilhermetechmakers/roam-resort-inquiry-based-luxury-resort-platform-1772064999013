/**
 * React Query hooks for media management.
 * Null-safe; guards all array operations.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  uploadMedia,
  getMedia,
  getMediaByEntity,
  deleteMedia,
  updateMediaTransform,
  reorderMediaForEntity,
  type UploadMediaPayload,
} from '@/api/media'
import type { MediaOwnerType } from '@/types/media'

export const mediaKeys = {
  all: ['media'] as const,
  byId: (id: string) => ['media', 'id', id] as const,
  byEntity: (entityType: MediaOwnerType, entityId: string) =>
    ['media', 'entity', entityType, entityId] as const,
}

export function useMedia(id: string | undefined) {
  return useQuery({
    queryKey: mediaKeys.byId(id ?? ''),
    queryFn: () => getMedia(id!),
    enabled: !!id,
  })
}

export function useMediaByEntity(entityType: MediaOwnerType, entityId: string | undefined) {
  return useQuery({
    queryKey: mediaKeys.byEntity(entityType, entityId ?? ''),
    queryFn: () => getMediaByEntity(entityType, entityId!),
    enabled: !!entityId,
  })
}

export function useUploadMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UploadMediaPayload) => uploadMedia(payload),
    onSuccess: (data, variables) => {
      if (data.asset) {
        queryClient.invalidateQueries({ queryKey: mediaKeys.byId(data.asset.id) })
        queryClient.invalidateQueries({
          queryKey: mediaKeys.byEntity(variables.ownerType, variables.ownerId),
        })
      }
    },
  })
}

export function useDeleteMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteMedia(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.byId(id) })
      queryClient.invalidateQueries({ queryKey: mediaKeys.all })
    },
  })
}

export function useReorderMedia(entityType: MediaOwnerType, entityId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (mediaAssetIds: string[]) =>
      reorderMediaForEntity(entityType, entityId, mediaAssetIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: mediaKeys.byEntity(entityType, entityId),
      })
    },
  })
}

export function useUpdateMediaTransform() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, transformations }: { id: string; transformations: Record<string, unknown> }) =>
      updateMediaTransform(id, transformations),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: mediaKeys.byId(data.id) })
      }
    },
  })
}
