import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchSupportMessages,
  createSupportMessage,
} from '@/api/support-messages'

export const supportMessagesKeys = {
  all: ['support-messages'] as const,
  list: (inquiryId: string) => [...supportMessagesKeys.all, 'list', inquiryId] as const,
}

export function useSupportMessages(inquiryId: string | null) {
  return useQuery({
    queryKey: supportMessagesKeys.list(inquiryId ?? ''),
    queryFn: () => fetchSupportMessages(inquiryId!),
    enabled: !!inquiryId,
  })
}

export function useCreateSupportMessage(inquiryId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      message: string
      sender: 'guest' | 'concierge'
      isInternal?: boolean
    }) => createSupportMessage(inquiryId!, payload),
    onSuccess: () => {
      if (inquiryId) {
        qc.invalidateQueries({ queryKey: supportMessagesKeys.list(inquiryId) })
      }
    },
  })
}
