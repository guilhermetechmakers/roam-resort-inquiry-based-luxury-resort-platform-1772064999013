import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchUserSettings,
  updateUserSettings,
  fetchPrivacyRequests,
  fetchSessions,
  logoutOtherSessions,
  initiateDataExport,
  initiateAccountDeletion,
} from '@/api/settings'
const SETTINGS_QUERY_KEY = ['settings', 'me']
const PRIVACY_QUERY_KEY = ['settings', 'privacy']
const SESSIONS_QUERY_KEY = ['settings', 'sessions']

export function useUserSettings(enabled = true) {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchUserSettings,
    enabled,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof updateUserSettings>[0]) =>
      updateUserSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY })
    },
  })
}

export function usePrivacyRequests(enabled = true) {
  return useQuery({
    queryKey: PRIVACY_QUERY_KEY,
    queryFn: fetchPrivacyRequests,
    enabled,
    refetchInterval: 30_000, // Poll every 30s
  })
}

export function useSessions(enabled = true) {
  return useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: fetchSessions,
    enabled,
  })
}

export function useLogoutOtherSessions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logoutOtherSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY })
    },
  })
}

export function useInitiateDataExport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: initiateDataExport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRIVACY_QUERY_KEY })
    },
  })
}

export function useInitiateAccountDeletion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: initiateAccountDeletion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRIVACY_QUERY_KEY })
    },
  })
}
