import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchEmailJobs,
  fetchEmailJobById,
  fetchSuppressionList,
  sendEmail,
} from '@/api/email-jobs'
import type { EmailSendPayload } from '@/types/email'

export function useEmailJobs(params?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: ['email-jobs', params],
    queryFn: () => fetchEmailJobs(params),
  })
}

export function useEmailJob(id: string | null) {
  return useQuery({
    queryKey: ['email-job', id],
    queryFn: () => (id ? fetchEmailJobById(id) : null),
    enabled: !!id,
  })
}

export function useSuppressionList(params?: { limit?: number }) {
  return useQuery({
    queryKey: ['suppression-list', params],
    queryFn: () => fetchSuppressionList(params),
  })
}

export function useSendEmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: EmailSendPayload) => sendEmail(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-jobs'] }),
  })
}
