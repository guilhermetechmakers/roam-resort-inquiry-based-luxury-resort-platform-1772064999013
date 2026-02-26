import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Inquiry } from '@/types'
import type { InquiryEvent, InternalNote } from '@/types'

export interface InquiryDetail extends Inquiry {
  events?: InquiryEvent[]
  internalNotes?: InternalNote[]
  emails?: { id: string; sentAt: string; subject?: string }[]
}

async function fetchInquiryDetail(
  inquiryId: string,
  userId: string,
  isStaff: boolean
): Promise<InquiryDetail | null> {
  const { data: inquiry, error } = await supabase
    .from('inquiries')
    .select('*, listing:listings(*)')
    .eq('id', inquiryId)
    .eq('guest_id', userId)
    .single()

  if (error || !inquiry) return null

  const base: InquiryDetail = inquiry as InquiryDetail

  try {
    const { data: events } = await supabase
      .from('inquiry_events')
      .select('*')
      .eq('inquiry_id', inquiryId)
      .order('created_at', { ascending: false })
    base.events = Array.isArray(events) ? (events as InquiryEvent[]) : []
  } catch {
    base.events = []
  }

  if (isStaff) {
    try {
      const { data: notes } = await supabase
        .from('internal_notes')
        .select('*')
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: false })
      base.internalNotes = Array.isArray(notes) ? (notes as InternalNote[]) : []
    } catch {
      base.internalNotes = []
    }
  } else {
    base.internalNotes = []
  }

  base.emails = []
  return base
}

export function useInquiryDetail(
  inquiryId: string | undefined,
  userId: string | undefined,
  isStaff: boolean
) {
  return useQuery({
    queryKey: ['inquiry', 'detail', inquiryId, userId, isStaff],
    queryFn: () =>
      inquiryId && userId
        ? fetchInquiryDetail(inquiryId, userId, isStaff)
        : Promise.resolve(null),
    enabled: !!inquiryId && !!userId,
  })
}

export function useAddInternalNote(inquiryId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      content,
      authorId,
    }: {
      content: string
      authorId: string
    }) => {
      if (!inquiryId) throw new Error('No inquiry')
      const { data, error } = await supabase
        .from('internal_notes')
        .insert({
          inquiry_id: inquiryId,
          author_id: authorId,
          content,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiry', 'detail'] })
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
    },
  })
}
