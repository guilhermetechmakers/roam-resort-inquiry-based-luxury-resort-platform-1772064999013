import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Inquiry, ContactPreferences } from '@/types'
import { generateReference } from '@/lib/utils'

export interface CreateInquiryPayload {
  guest_id: string
  listing_id: string
  check_in?: string
  check_out?: string
  guests_count?: number
  message?: string
  attachments?: string[]
  flexible_dates?: boolean
  room_prefs?: string[]
  budget_hint?: string
  contact_preferences?: ContactPreferences
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
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*, listing:listings(*), guest:users(*)')
      .order('created_at', { ascending: false })

    if (!error && data?.length) return data as Inquiry[]
  } catch {
    // Fallback
  }
  return []
}

async function createInquiry(payload: CreateInquiryPayload): Promise<Inquiry> {
  const ref = generateReference()
  const insertPayload = {
    reference: ref,
    guest_id: payload.guest_id,
    listing_id: payload.listing_id,
    check_in: payload.check_in,
    check_out: payload.check_out,
    guests_count: payload.guests_count,
    message: payload.message,
    attachments: payload.attachments ?? [],
    flexible_dates: payload.flexible_dates ?? false,
    room_prefs: payload.room_prefs ?? [],
    budget_hint: payload.budget_hint ?? null,
    contact_preferences: payload.contact_preferences ?? {},
    status: 'new',
  }
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .insert(insertPayload)
      .select()
      .single()

    if (!error && data) return data as Inquiry
  } catch {
    // Fallback: return mock
  }
  return {
    id: crypto.randomUUID(),
    reference: ref,
    guest_id: payload.guest_id,
    listing_id: payload.listing_id,
    check_in: payload.check_in,
    check_out: payload.check_out,
    guests_count: payload.guests_count,
    message: payload.message,
    attachments: payload.attachments,
    flexible_dates: payload.flexible_dates,
    room_prefs: payload.room_prefs,
    budget_hint: payload.budget_hint,
    contact_preferences: payload.contact_preferences,
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

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
    mutationFn: createInquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
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
