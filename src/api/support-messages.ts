/**
 * Support Inquiry Messages API
 * Conversation thread for contact/support inquiries.
 */

import { supabase } from '@/lib/supabase'
import type { SupportInquiryMessage } from '@/types/support-message'

export async function fetchSupportMessages(inquiryId: string): Promise<SupportInquiryMessage[]> {
  const { data, error } = await supabase
    .from('support_inquiry_messages')
    .select('*')
    .eq('inquiry_id', inquiryId)
    .order('created_at', { ascending: true })

  if (error) throw error
  const list = Array.isArray(data) ? data : []
  return list.map((row) => ({
    id: row.id,
    inquiry_id: row.inquiry_id ?? '',
    sender: (row.sender ?? 'guest') as SupportInquiryMessage['sender'],
    message: row.message ?? '',
    is_internal: row.is_internal ?? false,
    created_at: row.created_at ?? '',
    created_by: row.created_by ?? null,
  }))
}

export async function createSupportMessage(
  inquiryId: string,
  payload: { message: string; sender: 'guest' | 'concierge'; isInternal?: boolean }
): Promise<SupportInquiryMessage> {
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id ?? null

  const { data, error } = await supabase
    .from('support_inquiry_messages')
    .insert({
      inquiry_id: inquiryId,
      sender: payload.sender,
      message: payload.message,
      is_internal: payload.isInternal ?? false,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  const row = data ?? {}
  return {
    id: row.id,
    inquiry_id: row.inquiry_id ?? '',
    sender: (row.sender ?? 'guest') as SupportInquiryMessage['sender'],
    message: row.message ?? '',
    is_internal: row.is_internal ?? false,
    created_at: row.created_at ?? '',
    created_by: row.created_by ?? null,
  }
}
