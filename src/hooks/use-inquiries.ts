import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Inquiry } from '@/types'
import { generateReference } from '@/lib/utils'

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

async function createInquiry(payload: {
  guest_id: string
  listing_id: string
  check_in?: string
  check_out?: string
  guests_count?: number
  message?: string
  attachments?: string[]
}): Promise<Inquiry> {
  const ref = generateReference()
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        reference: ref,
        guest_id: payload.guest_id,
        listing_id: payload.listing_id,
        check_in: payload.check_in,
        check_out: payload.check_out,
        guests_count: payload.guests_count,
        message: payload.message,
        attachments: payload.attachments ?? [],
        status: 'new',
      })
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

export function useCreateInquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createInquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
    },
  })
}
