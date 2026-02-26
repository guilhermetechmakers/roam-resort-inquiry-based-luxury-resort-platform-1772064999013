import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Inquiry, ContactPreferences } from '@/types'
import {
  createInquiry as apiCreateInquiry,
  saveInquiryDraft,
  getInquiryDraft,
  type CreateInquiryPayload,
  type InquiryDraftData,
} from '@/api/inquiries'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(str: string): boolean {
  return UUID_REGEX.test(str)
}

async function fetchInquiryByIdOrReference(
  idOrRef: string,
  userId?: string
): Promise<Inquiry | null> {
  try {
    let query = supabase
      .from('inquiries')
      .select('*, listing:listings(*), inquiry_attachments(id, filename, storage_url, size, mime_type, uploaded_at)')

    if (isUuid(idOrRef)) {
      query = query.eq('id', idOrRef)
    } else {
      query = query.eq('reference', idOrRef)
    }

    if (userId) {
      query = query.eq('guest_id', userId)
    }

    const { data, error } = await query.single()

    if (!error && data) {
      const row = data as Inquiry & { inquiry_attachments?: Array<{ id: string; filename: string; storage_url?: string; size?: number; mime_type?: string; uploaded_at?: string }> }
      const atts = Array.isArray(row.inquiry_attachments) ? row.inquiry_attachments : []
      const attachments = atts.map((a) => ({
        id: a.id,
        name: a.filename,
        file_url: a.storage_url ?? '',
        mime_type: a.mime_type ?? 'application/octet-stream',
        size: a.size ?? 0,
        uploaded_at: a.uploaded_at ?? '',
      }))
      const { inquiry_attachments: _, ...rest } = row
      void _
      return { ...rest, attachments } as Inquiry
    }
  } catch {
    // Fallback: try without inquiry_attachments if table doesn't exist
    let query = supabase.from('inquiries').select('*, listing:listings(*)')
    if (isUuid(idOrRef)) query = query.eq('id', idOrRef)
    else query = query.eq('reference', idOrRef)
    if (userId) query = query.eq('guest_id', userId)
    const { data, error } = await query.single()
    if (!error && data) return data as Inquiry
  }
  return null
}

export function useInquiryByIdOrReference(idOrRef: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['inquiry', 'detail', idOrRef, userId],
    queryFn: () =>
      idOrRef && userId
        ? fetchInquiryByIdOrReference(idOrRef, userId)
        : Promise.resolve(null),
    enabled: !!idOrRef && !!userId,
  })
}

async function fetchMyInquiries(userId: string): Promise<Inquiry[]> {
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*, listing:listings(*)')
      .eq('guest_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data?.length) return data as Inquiry[]
  } catch {
    // Fallback
  }
  return []
}

async function fetchAdminInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*, listing:listings(*), guest:profiles(*)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return Array.isArray(data) ? (data as Inquiry[]) : []
}

export type { CreateInquiryPayload }

export function useMyInquiries(userId: string | undefined) {
  return useQuery({
    queryKey: ['inquiries', 'mine', userId],
    queryFn: () => (userId ? fetchMyInquiries(userId) : []),
    enabled: !!userId,
  })
}

export function useAdminInquiries() {
  return useQuery({
    queryKey: ['inquiries', 'admin'],
    queryFn: fetchAdminInquiries,
  })
}

export interface UpdateInquiryPayload {
  status?: string
  internal_notes?: string
  check_in?: string
  check_out?: string
  guests_count?: number
  message?: string
  room_prefs?: string[]
  budget_hint?: string
  contact_preferences?: ContactPreferences
}

async function updateInquiry(
  id: string,
  payload: UpdateInquiryPayload
): Promise<Inquiry> {
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (!error && data) return data as Inquiry
  } catch {
    // Fallback
  }
  throw new Error('Failed to update inquiry')
}

export function useCreateInquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInquiryPayload & { attachmentFiles?: Array<{ file: File }> }) =>
      apiCreateInquiry({
        ...payload,
        attachmentFiles: payload.attachmentFiles,
      }) as Promise<Inquiry>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
    },
  })
}

export function useInquiryDraft(listingId: string | null) {
  return useQuery({
    queryKey: ['inquiry-draft', listingId],
    queryFn: () =>
      listingId ? getInquiryDraft(listingId) : Promise.resolve({ draft: null }),
    enabled: !!listingId,
  })
}

export function useSaveInquiryDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ listingId, data }: { listingId: string; data: InquiryDraftData }) =>
      saveInquiryDraft(listingId, data),
    onSuccess: (_, { listingId }) => {
      queryClient.invalidateQueries({ queryKey: ['inquiry-draft', listingId] })
    },
  })
}

export function useUpdateInquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInquiryPayload }) =>
      updateInquiry(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
    },
  })
}
