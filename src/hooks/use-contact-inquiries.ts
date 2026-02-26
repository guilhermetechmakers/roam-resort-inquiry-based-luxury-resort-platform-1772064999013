import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchContactInquiries,
  fetchContactInquiryById,
  updateContactInquiry,
} from '@/api/contact-inquiries'

export function useContactInquiries(params?: { status?: string; isConcierge?: boolean }) {
  return useQuery({
    queryKey: ['contact-inquiries', params],
    queryFn: () => fetchContactInquiries(params),
  })
}

export function useContactInquiry(id: string | null) {
  return useQuery({
    queryKey: ['contact-inquiry', id],
    queryFn: () => (id ? fetchContactInquiryById(id) : null),
    enabled: !!id,
  })
}

export function useUpdateContactInquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: { status?: string; internal_notes?: string }
    }) => updateContactInquiry(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-inquiries'] })
      queryClient.invalidateQueries({ queryKey: ['contact-inquiry'] })
    },
  })
}
