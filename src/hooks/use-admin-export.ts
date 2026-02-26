/**
 * React Query hooks for Admin CSV Export.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchFieldOptions,
  fetchHosts,
  createExportJob,
  fetchExports,
  fetchExportStatus,
  fetchDownloadUrl,
  retryExport,
  cancelExport,
} from '@/api/admin-export'
import type { CreateExportPayload } from '@/types/export'

export const exportKeys = {
  all: ['admin', 'export'] as const,
  fields: (dataset: string) => [...exportKeys.all, 'fields', dataset] as const,
  hosts: () => [...exportKeys.all, 'hosts'] as const,
  list: () => [...exportKeys.all, 'list'] as const,
  status: (id: string) => [...exportKeys.all, 'status', id] as const,
}

export function useExportFields(dataset: 'inquiries' | 'reconciliation' | null) {
  return useQuery({
    queryKey: exportKeys.fields(dataset ?? ''),
    queryFn: () => fetchFieldOptions(dataset ?? 'inquiries'),
    enabled: dataset !== null,
  })
}

export function useExportHosts() {
  return useQuery({
    queryKey: exportKeys.hosts(),
    queryFn: fetchHosts,
  })
}

export function useExportsList() {
  return useQuery({
    queryKey: exportKeys.list(),
    queryFn: () => fetchExports(50),
  })
}

export function useExportStatus(exportId: string | null, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: exportKeys.status(exportId ?? ''),
    queryFn: () => fetchExportStatus(exportId ?? ''),
    enabled: !!exportId,
    refetchInterval: options?.refetchInterval ?? false,
  })
}

export function useCreateExport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateExportPayload) => createExportJob(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: exportKeys.list() })
      toast.success('Export job created')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to create export')
    },
  })
}

export function useRetryExport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (exportId: string) => retryExport(exportId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: exportKeys.list() })
      toast.success('Export retried')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to retry')
    },
  })
}

export function useCancelExport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (exportId: string) => cancelExport(exportId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: exportKeys.list() })
      toast.success('Export cancelled')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to cancel')
    },
  })
}

export function useDownloadExport() {
  return useMutation({
    mutationFn: async (exportId: string) => {
      const url = await fetchDownloadUrl(exportId)
      if (!url) throw new Error('Download not available')
      return { url, exportId }
    },
  })
}
