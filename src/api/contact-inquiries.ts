/**
 * Contact Inquiries API
 * Submits to contact-inquiry-create Edge Function.
 * Public endpoint - no auth required for submission.
 */

import type {
  CreateContactInquiryPayload,
  CreateContactInquiryResponse,
  ContactInquiry,
} from '@/types/contact-inquiry'
import { supabase } from '@/lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`

export async function submitContactInquiry(
  payload: CreateContactInquiryPayload
): Promise<CreateContactInquiryResponse> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

  const res = await fetch(`${FUNCTIONS_BASE}/contact-inquiry-create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      subject: payload.subject,
      message: payload.message,
      destination_id: payload.destinationId ?? null,
      start_date: payload.startDate ?? null,
      end_date: payload.endDate ?? null,
      guests: payload.guests ?? null,
      inquiry_reference: payload.inquiryReference ?? null,
      is_concierge: payload.isConcierge ?? false,
      preferred_contact_method: payload.preferredContactMethod ?? null,
      user_id: payload.userId ?? null,
    }),
  })

  const data = (await res.json().catch(() => ({}))) as
    | CreateContactInquiryResponse
    | { error?: string; message?: string }

  if (!res.ok) {
    const errMsg =
      (data as { message?: string }).message ??
      (data as { error?: string }).error ??
      'Failed to submit inquiry'
    throw new Error(errMsg)
  }

  return data as CreateContactInquiryResponse
}

/** Fetch contact inquiries (admin only - concierge role) */
export async function fetchContactInquiries(params?: {
  status?: string
  isConcierge?: boolean
}): Promise<ContactInquiry[]> {
  let q = supabase
    .from('contact_inquiries')
    .select('*, destination:listings(id, title, slug)')
    .order('created_at', { ascending: false })

  if (params?.status && params.status !== 'all') {
    q = q.eq('status', params.status)
  }
  if (params?.isConcierge !== undefined) {
    q = q.eq('is_concierge', params.isConcierge)
  }

  const { data, error } = await q

  if (error) throw error
  const list = Array.isArray(data) ? data : []
  return list.map((row) => ({
    id: row.id,
    user_id: row.user_id ?? null,
    name: row.name ?? '',
    email: row.email ?? '',
    subject: row.subject ?? '',
    message: row.message ?? '',
    destination_id: row.destination_id ?? null,
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
    guests: row.guests ?? null,
    inquiry_reference: row.inquiry_reference ?? null,
    is_concierge: row.is_concierge ?? false,
    preferred_contact_method: row.preferred_contact_method ?? null,
    status: row.status ?? 'new',
    internal_notes: row.internal_notes ?? null,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
    destination: row.destination ?? null,
  }))
}

/** Fetch single contact inquiry by id */
export async function fetchContactInquiryById(
  id: string
): Promise<ContactInquiry | null> {
  const { data, error } = await supabase
    .from('contact_inquiries')
    .select('*, destination:listings(id, title, slug)')
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    user_id: data.user_id ?? null,
    name: data.name ?? '',
    email: data.email ?? '',
    subject: data.subject ?? '',
    message: data.message ?? '',
    destination_id: data.destination_id ?? null,
    start_date: data.start_date ?? null,
    end_date: data.end_date ?? null,
    guests: data.guests ?? null,
    inquiry_reference: data.inquiry_reference ?? null,
    is_concierge: data.is_concierge ?? false,
    preferred_contact_method: data.preferred_contact_method ?? null,
    status: data.status ?? 'new',
    internal_notes: data.internal_notes ?? null,
    created_at: data.created_at ?? '',
    updated_at: data.updated_at ?? '',
    destination: data.destination ?? null,
  }
}

/** Update contact inquiry (admin: status, internal notes) */
export async function updateContactInquiry(
  id: string,
  updates: { status?: string; internal_notes?: string }
): Promise<ContactInquiry> {
  const { data, error } = await supabase
    .from('contact_inquiries')
    .update({
      status: updates.status,
      internal_notes: updates.internal_notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, destination:listings(id, title, slug)')
    .single()

  if (error) throw error
  const row = data ?? {}

  return {
    id: row.id,
    user_id: row.user_id ?? null,
    name: row.name ?? '',
    email: row.email ?? '',
    subject: row.subject ?? '',
    message: row.message ?? '',
    destination_id: row.destination_id ?? null,
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
    guests: row.guests ?? null,
    inquiry_reference: row.inquiry_reference ?? null,
    is_concierge: row.is_concierge ?? false,
    preferred_contact_method: row.preferred_contact_method ?? null,
    status: row.status ?? 'new',
    internal_notes: row.internal_notes ?? null,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
    destination: row.destination ?? null,
  }
}
