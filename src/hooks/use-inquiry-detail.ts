import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchActivities } from '@/api/activities'
import { fetchInquiryInternalNotes } from '@/api/admin-inquiry-detail'
import type { Inquiry } from '@/types'
import type { InquiryEvent, InternalNote } from '@/types'

export interface InquiryDetail extends Inquiry {
  events?: InquiryEvent[]
  internalNotes?: InternalNote[]
  emails?: { id: string; sentAt: string; subject?: string }[]
}

/** Map Activity to InquiryEvent shape for backward compat */
function activityToEvent(
  a: {
    id: string
    inquiry_id?: string
    event_type: string
    timestamp?: string
    created_at?: string
    actor_name?: string
    metadata?: Record<string, unknown>
  },
  inquiryId: string
): InquiryEvent {
  const meta = a.metadata ?? {}
  let details = (meta.details as string) ?? (meta.content as string)
  if (!details && a.event_type === 'status_changed') {
    const from = meta.from as string | undefined
    const to = meta.to as string | undefined
    details = from && to ? `${from} → ${to}` : 'Status updated'
  }
  return {
    id: a.id,
    inquiryId: a.inquiry_id ?? inquiryId,
    eventType: a.event_type,
    timestamp: a.timestamp ?? a.created_at ?? '',
    metadata: { ...meta, details },
  }
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
    const { activities } = await fetchActivities({
      inquiryId,
      limit: 50,
      includeInternal: false,
    })
    base.events = Array.isArray(activities) ? activities.map((a) => activityToEvent(a, inquiryId)) : []
  } catch {
    base.events = []
  }

  if (isStaff) {
    try {
      const notes = await fetchInquiryInternalNotes(
        inquiryId,
        typeof (inquiry as { internal_notes?: string }).internal_notes === 'string'
          ? (inquiry as { internal_notes: string }).internal_notes
          : undefined
      )
      base.internalNotes = (notes ?? []).map((n) => ({
        id: n.id,
        inquiryId: n.inquiryId,
        authorId: '',
        authorName: n.authorName,
        content: n.text,
        visibleTo: undefined,
        createdAt: n.createdAt,
        created_at: n.createdAt,
      }))
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
      authorName,
    }: {
      content: string
      authorId: string
      authorName?: string
    }) => {
      if (!inquiryId) throw new Error('No inquiry')
      const { createInquiryInternalNote } = await import('@/api/admin-inquiry-detail')
      const { createInternalNoteActivity } = await import('@/api/activities')
      const note = await createInquiryInternalNote(
        inquiryId,
        content,
        authorId,
        authorName ?? 'Staff'
      )
      try {
        await createInternalNoteActivity(inquiryId, content, authorId, authorName)
      } catch {
        // Activities table may not exist
      }
      return note
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiry', 'detail'] })
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
      queryClient.invalidateQueries({ queryKey: ['activities', inquiryId] })
    },
  })
}
