import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCurrentProfile,
  updateProfile,
  changePassword,
  fetchSessions,
  terminateSession,
  fetchMessages,
  markMessageRead,
  type UpdateProfilePayload,
} from '@/api/profile'
import type { ChangePasswordFormData } from '@/lib/validation/profile-validation'

const PROFILE_QUERY_KEY = ['profile', 'me']
const SESSIONS_QUERY_KEY = ['profile', 'sessions']
const MESSAGES_QUERY_KEY = ['profile', 'messages']

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: [...PROFILE_QUERY_KEY, userId],
    queryFn: () => fetchCurrentProfile(),
    enabled: !!userId,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
    },
  })
}

export function useSessions(userId: string | undefined) {
  return useQuery({
    queryKey: [...SESSIONS_QUERY_KEY, userId],
    queryFn: () => (userId ? fetchSessions(userId) : []),
    enabled: !!userId,
  })
}

export function useTerminateSession(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId }: { sessionId: string }) =>
      userId ? terminateSession(userId, sessionId) : Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY })
    },
  })
}

export function useMessages(userId: string | undefined) {
  return useQuery({
    queryKey: [...MESSAGES_QUERY_KEY, userId],
    queryFn: () => (userId ? fetchMessages(userId) : []),
    enabled: !!userId,
  })
}

export function useMarkMessageRead(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (messageId: string) =>
      userId ? markMessageRead(userId, messageId) : Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MESSAGES_QUERY_KEY })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      email,
      currentPassword,
      newPassword,
    }: ChangePasswordFormData & { email: string }) =>
      changePassword(email, currentPassword, newPassword),
  })
}
