/**
 * Inquiry API - Edge Functions and Supabase
 * createInquiryViaEdge: POST to create-inquiry Edge Function (validation, email)
 * saveInquiryDraft, getInquiryDraft: inquiry-drafts Edge Function
 * uploadInquiryAttachment: upload-inquiry-attachment Edge Function
 */

import { supabase } from '@/lib/supabase'
import type { ContactPreferences } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''

export interface CreateInquiryEdgePayload {
  guest_id: string
  listing_id: string
  check_in?: string
  check_out?: string
  guests_count?: number
  rooms_count?: number
  message?: string
  flexible_dates?: boolean
  room_prefs?: string[]
  suite_preferences?: string[]
  budget_hint?: string
  contact_preferences?: ContactPreferences
  consent_privacy?: boolean
  consent_terms?: boolean
}

export interface CreateInquiryEdgeResponse {
  id: string
  reference: string
  status: string
}

export async function createInquiryViaEdge(
  payload: CreateInquiryEdgePayload
): Promise<CreateInquiryEdgeResponse> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('You must be signed in to submit an inquiry')
  }

  const url = `${SUPABASE_URL}/functions/v1/inquiry-create`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  })

  const json = (await res.json().catch(() => ({}))) as
    | CreateInquiryEdgeResponse
    | { error?: string }

  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? 'Failed to create inquiry')
  }

  return json as CreateInquiryEdgeResponse
}

export interface InquiryDraftData {
  arrival_date?: string
  departure_date?: string
  flexible_dates?: boolean
  guests?: number
  rooms_count?: number
  room_prefs?: string[]
  budget_hint?: string
  notes?: string
  contact_email?: boolean
  contact_sms?: boolean
  contact_phone?: boolean
  consent_privacy?: boolean
  consent_terms?: boolean
}

export async function saveInquiryDraft(
  listingId: string | null,
  data: InquiryDraftData
): Promise<{ ok: boolean }> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('You must be signed in to save a draft')
  }

  const url = `${SUPABASE_URL}/functions/v1/inquiry-drafts`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ listing_id: listingId ?? null, data }),
  })

  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
  if (!res.ok) {
    throw new Error(json.error ?? 'Failed to save draft')
  }
  return { ok: json.ok ?? true }
}

export async function getInquiryDraft(
  listingId: string | null
): Promise<{ draft: { id?: string; data?: InquiryDraftData; last_saved_at?: string } | null }> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return { draft: null }
  }

  const url = `${SUPABASE_URL}/functions/v1/inquiry-drafts${listingId ? `?listing_id=${encodeURIComponent(listingId)}` : ''}`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  const json = (await res.json().catch(() => ({}))) as {
    draft?: { id?: string; data?: InquiryDraftData; last_saved_at?: string } | null
    error?: string
  }
  if (!res.ok) {
    return { draft: null }
  }
  return { draft: json.draft ?? null }
}

export interface CreateInquiryPayload {
  guest_id: string
  listing_id: string
  check_in?: string
  check_out?: string
  guests_count?: number
  rooms_count?: number
  message?: string
  flexible_dates?: boolean
  room_prefs?: string[]
  budget_hint?: string
  contact_preferences?: ContactPreferences
  consent_privacy?: boolean
  consent_terms?: boolean
  attachmentFiles?: Array<{ file: File }>
}

import type { Inquiry } from '@/types'

export async function createInquiry(payload: CreateInquiryPayload): Promise<Inquiry> {
  const edgePayload: CreateInquiryEdgePayload = {
    guest_id: payload.guest_id,
    listing_id: payload.listing_id,
    check_in: payload.check_in,
    check_out: payload.check_out,
    guests_count: payload.guests_count,
    rooms_count: payload.rooms_count,
    message: payload.message,
    flexible_dates: payload.flexible_dates ?? false,
    room_prefs: payload.room_prefs ?? [],
    budget_hint: payload.budget_hint,
    contact_preferences: payload.contact_preferences ?? { email: true, sms: false, phone: false },
    consent_privacy: payload.consent_privacy ?? false,
    consent_terms: payload.consent_terms ?? false,
  }

  const result = await createInquiryViaEdge(edgePayload)

  const files = payload.attachmentFiles ?? []
  for (let i = 0; i < files.length; i++) {
    const att = files[i]
    if (att?.file) {
      try {
        await uploadInquiryAttachment(result.id, att.file)
      } catch {
        // Continue on attachment upload failure
      }
    }
  }

  const { data } = await supabase
    .from('inquiries')
    .select('*, listing:listings(*)')
    .eq('id', result.id)
    .single()

  if (data) return data as Inquiry

  return {
    id: result.id,
    reference: result.reference,
    guest_id: payload.guest_id,
    listing_id: payload.listing_id,
    check_in: payload.check_in,
    check_out: payload.check_out,
    guests_count: payload.guests_count,
    message: payload.message,
    status: (result.status as Inquiry['status']) ?? 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export async function uploadInquiryAttachment(
  inquiryId: string,
  file: File
): Promise<{ id: string; filename: string; storage_url: string }> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('You must be signed in to upload attachments')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('inquiry_id', inquiryId)

  const url = `${SUPABASE_URL}/functions/v1/inquiry-attachments`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: formData,
  })

  const json = (await res.json().catch(() => ({}))) as
    | { id: string; filename: string; storage_url: string }
    | { error?: string }

  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? 'Failed to upload attachment')
  }

  return json as { id: string; filename: string; storage_url: string }
}
