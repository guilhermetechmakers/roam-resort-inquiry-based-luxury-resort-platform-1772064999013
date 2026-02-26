/**
 * React Query hooks for Admin Inquiry Detail page.
 * Fetches single inquiry, updates status, manages notes, payments.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchAdminInquiryDetail,
  updateAdminInquiryStatus,
  createAdminInternalNote,
  updateAdminInternalNote,
  deleteAdminInternalNote,
  createStripePaymentLink,
  markPaymentReceived,
} from '@/api/admin'
import type { AdminInquiryDetail, StripeLinkPayload } from '@/types/admin'

export function useAdminInquiryDetail(inquiryId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'inquiry', 'detail', inquiryId],
    queryFn: () => (inquiryId ? fetchAdminInquiryDetail(inquiryId) : Promise.resolve(null)),
    enabled: !!inquiryId,
  })
}

export function useUpdateAdminInquiryStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ inquiryId, status }: { inquiryId: string; status: string }) =>
      updateAdminInquiryStatus(inquiryId, status),
    onSuccess: (_, { inquiryId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inquiry', 'detail', inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'admin'] })
    },
  })
}

export function useCreateAdminInternalNote(inquiryId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ text, authorName }: { text: string; authorName: string }) =>
      createAdminInternalNote(inquiryId, text, authorName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inquiry', 'detail', inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'admin'] })
    },
  })
}

export function useUpdateAdminInternalNote(inquiryId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ noteId, text }: { noteId: string; text: string }) =>
      updateAdminInternalNote(inquiryId, noteId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inquiry', 'detail', inquiryId] })
    },
  })
}

export function useDeleteAdminInternalNote(inquiryId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (noteId: string) => deleteAdminInternalNote(inquiryId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inquiry', 'detail', inquiryId] })
    },
  })
}

export function useCreateStripePaymentLink(inquiryId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StripeLinkPayload) => createStripePaymentLink(inquiryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inquiry', 'detail', inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'admin'] })
    },
  })
}

export function useMarkPaymentReceived(inquiryId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markPaymentReceived(inquiryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inquiry', 'detail', inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'admin'] })
    },
  })
}
