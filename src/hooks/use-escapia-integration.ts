/**
 * React Query hooks for Escapia integration.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchEscapiaSyncStatus,
  saveEscapiaCredentials,
  triggerEscapiaSync,
  removeEscapiaCredentials,
  type EscapiaSyncStatus,
} from '@/api/escapia-integration'

const SYNC_STATUS_KEY = ['escapia', 'sync-status'] as const

export function useEscapiaSyncStatus(enabled = true) {
  return useQuery<EscapiaSyncStatus | null>({
    queryKey: SYNC_STATUS_KEY,
    queryFn: fetchEscapiaSyncStatus,
    enabled,
    // Poll while a sync is in progress
    refetchInterval: (query) => {
      return query.state.data?.last_sync_status === 'syncing' ? 3000 : false
    },
    staleTime: 30 * 1000,
  })
}

export function useSaveEscapiaCredentials() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ clientId, clientSecret }: { clientId: string; clientSecret: string }) =>
      saveEscapiaCredentials(clientId, clientSecret),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SYNC_STATUS_KEY })
      // Refresh listings since initial sync may have created new rows
      queryClient.invalidateQueries({ queryKey: ['host', 'listings'] })
      queryClient.invalidateQueries({ queryKey: ['host', 'stats'] })
    },
  })
}

export function useTriggerEscapiaSync() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: triggerEscapiaSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SYNC_STATUS_KEY })
      queryClient.invalidateQueries({ queryKey: ['host', 'listings'] })
      queryClient.invalidateQueries({ queryKey: ['host', 'stats'] })
    },
  })
}

export function useRemoveEscapiaCredentials() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeEscapiaCredentials,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SYNC_STATUS_KEY })
    },
  })
}
