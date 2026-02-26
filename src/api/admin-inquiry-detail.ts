/**
 * Admin Inquiry Detail API.
 * Fetches single inquiry, updates status, manages internal notes, payments, and export.
 * Uses Supabase client; Stripe link creation via Edge Function.
 */

import { supabase } from '@/lib/supabase'
import type { Inquiry } from '@/types'
import type {
  AdminInquiryDetailNote,
  AdminTimelineEvent,
  AdminInquiryPayment,
  StripeLinkPayload,
  InquiryStatusValue,
} from '@/types/admin'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const STATUS_OPTIONS: InquiryStatusValue[] = [
  'new',
  'contacted',
  'deposit_paid',
  'confirmed',
  'cancelled',
]

function isValidStatus(s: string): s is InquiryStatusValue {
  return STATUS_OPTIONS.includes(s as InquiryStatusValue)
}

/** Fetch single inquiry by ID with listing and guest */
export async function fetchAdminInquiryDetail(
  inquiryId: string
): Promise<Inquiry | null> {
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*, listing:listings(*), guest:users(*)')
      .eq('id', inquiryId)
      .single()

    if (!error && data) return data as Inquiry
  } catch {
    // Fallback
  }
  return null
}

/** Update inquiry status */
export async function updateInquiryStatus(
  inquiryId: string,
  status: InquiryStatusValue
): Promise<Inquiry> {
  if (!isValidStatus(status)) {
    throw new Error('Invalid status value')
  }
  const { data, error } = await supabase
    .from('inquiries')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', inquiryId)
    .select()
    .single()

  if (error) throw new Error(error.message ?? 'Failed to update status')
  return data as Inquiry
}

/** Parse legacy internal_notes string into note objects */
function parseLegacyNotes(
  inquiryId: string,
  internalNotes?: string
): AdminInquiryDetailNote[] {
  if (!internalNotes || typeof internalNotes !== 'string') return []
  const lines = internalNotes.split(/\n\n+/)
  return lines
    .map((line) => {
      const match = line.match(/^\[([^\]]+)\]\s*([^:]+):\s*(.*)$/s)
      if (match) {
        return {
          id: `legacy-${match[1]}`,
          inquiryId,
          authorName: match[2].trim(),
          text: match[3].trim(),
          createdAt: match[1],
        }
      }
      return { id: `legacy-${Date.now()}-${Math.random()}`, inquiryId, authorName: 'Staff', text: line.trim(), createdAt: new Date().toISOString() }
    })
    .filter((n) => n.text.length > 0)
}

/** Fetch internal notes for an inquiry (from inquiry_internal_notes table or legacy internal_notes) */
export async function fetchInquiryInternalNotes(
  inquiryId: string,
  legacyNotes?: string
): Promise<AdminInquiryDetailNote[]> {
  try {
    const { data, error } = await supabase
      .from('inquiry_internal_notes')
      .select('*')
      .eq('inquiry_id', inquiryId)
      .order('created_at', { ascending: false })

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row: { id: string; inquiry_id: string; text: string; created_at: string; author_name?: string }) => ({
        id: row.id,
        inquiryId: row.inquiry_id,
        authorName: row.author_name ?? 'Staff',
        text: row.text ?? '',
        createdAt: row.created_at ?? '',
      }))
    }
  } catch {
    // Table may not exist
  }
  return parseLegacyNotes(inquiryId, legacyNotes)
}

/** Create internal note (uses inquiry_internal_notes table or falls back to inquiry.internal_notes) */
export async function createInquiryInternalNote(
  inquiryId: string,
  text: string,
  authorId: string,
  authorName?: string
): Promise<AdminInquiryDetailNote | null> {
  const { data, error } = await supabase
    .from('inquiry_internal_notes')
    .insert({
      inquiry_id: inquiryId,
      author_id: authorId,
      author_name: authorName ?? 'Staff',
      text: text.trim(),
    })
    .select()
    .single()

  if (!error && data) {
    return {
      id: data.id,
      inquiryId: data.inquiry_id,
      authorName: data.author_name ?? 'Staff',
      text: data.text ?? '',
      createdAt: data.created_at ?? '',
    }
  }

  // Fallback: append to inquiry internal_notes string when table doesn't exist
  const { data: inquiry } = await supabase
    .from('inquiries')
    .select('internal_notes')
    .eq('id', inquiryId)
    .single()

  const existing = (inquiry as { internal_notes?: string })?.internal_notes ?? ''
  const newNote = `[${new Date().toISOString()}] ${authorName ?? 'Staff'}: ${text.trim()}`
  const updated = existing ? `${existing}\n\n${newNote}` : newNote

  await supabase
    .from('inquiries')
    .update({
      internal_notes: updated,
      updated_at: new Date().toISOString(),
    })
    .eq('id', inquiryId)

  return {
    id: crypto.randomUUID(),
    inquiryId,
    authorName: authorName ?? 'Staff',
    text: text.trim(),
    createdAt: new Date().toISOString(),
  }
}

/** Update internal note */
export async function updateInquiryInternalNote(
  inquiryId: string,
  noteId: string,
  text: string
): Promise<void> {
  const { error } = await supabase
    .from('inquiry_internal_notes')
    .update({ text: text.trim(), updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .eq('inquiry_id', inquiryId)

  if (error) throw new Error(error.message ?? 'Failed to update note')
}

/** Delete internal note */
export async function deleteInquiryInternalNote(
  inquiryId: string,
  noteId: string
): Promise<void> {
  const { error } = await supabase
    .from('inquiry_internal_notes')
    .delete()
    .eq('id', noteId)
    .eq('inquiry_id', inquiryId)

  if (error) throw new Error(error.message ?? 'Failed to delete note')
}

/** Fetch payments for an inquiry */
export async function fetchInquiryPayments(
  inquiryId: string
): Promise<AdminInquiryPayment[]> {
  try {
    const { data, error } = await supabase
      .from('inquiry_payments')
      .select('*')
      .eq('inquiry_id', inquiryId)
      .order('created_at', { ascending: false })

    if (error) return []
    const list = Array.isArray(data) ? data : []
    return list.map((row: { id: string; inquiry_id: string; stripe_link_url?: string; amount: number; currency: string; status: string; created_at: string }) => ({
      id: row.id,
      inquiryId: row.inquiry_id,
      stripeLinkUrl: row.stripe_link_url,
      amount: row.amount ?? 0,
      currency: row.currency ?? 'USD',
      status: (row.status ?? 'pending') as AdminInquiryPayment['status'],
      createdAt: row.created_at ?? '',
    }))
  } catch {
    return []
  }
}

/** Create Stripe payment link via Edge Function */
export async function createStripePaymentLink(
  inquiryId: string,
  payload: StripeLinkPayload & { items?: Array<{ name: string; quantity: number; unitPrice: number; description?: string }> }
): Promise<{ paymentLinkUrl: string; paymentId: string }> {
  const url = `${SUPABASE_URL}/functions/v1/create-stripe-link`
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
    },
    body: JSON.stringify({ inquiryId, ...payload }),
  })

  const json = (await res.json().catch(() => ({}))) as {
    paymentLinkUrl?: string
    paymentId?: string
    error?: string
  }

  if (!res.ok || !json.paymentLinkUrl) {
    throw new Error(json.error ?? 'Failed to create payment link')
  }

  const amount = payload.amount ?? 0
  let paymentId = json.paymentId ?? ''

  try {
    const { data: inserted } = await supabase
      .from('inquiry_payments')
      .insert({
        inquiry_id: inquiryId,
        stripe_link_url: json.paymentLinkUrl,
        amount,
        currency: 'USD',
        status: 'link_created',
      })
      .select('id')
      .single()
    if (inserted?.id) paymentId = inserted.id
  } catch {
    // Table may not exist; still return URL
  }

  await supabase
    .from('inquiries')
    .update({
      payment_link: json.paymentLinkUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', inquiryId)

  return {
    paymentLinkUrl: json.paymentLinkUrl,
    paymentId,
  }
}

/** Mark payment as received */
export async function markPaymentReceived(
  inquiryId: string,
  paymentId: string
): Promise<void> {
  const { error } = await supabase
    .from('inquiry_payments')
    .update({ status: 'paid', updated_at: new Date().toISOString() })
    .eq('id', paymentId)
    .eq('inquiry_id', inquiryId)

  if (error) throw new Error(error.message ?? 'Failed to update payment')
}

/** Build timeline events from inquiry, notes, and payments */
export function buildTimelineEvents(
  inquiry: Inquiry | null,
  notes: AdminInquiryDetailNote[],
  payments: AdminInquiryPayment[]
): AdminTimelineEvent[] {
  const events: AdminTimelineEvent[] = []

  if (!inquiry) return events

  events.push({
    id: `created-${inquiry.id}`,
    inquiryId: inquiry.id,
    type: 'status',
    description: 'Inquiry created',
    createdAt: inquiry.created_at ?? '',
    authorName: undefined,
  })

  ;(notes ?? []).forEach((n) => {
    events.push({
      id: n.id,
      inquiryId: n.inquiryId,
      type: 'note',
      description: n.text,
      createdAt: n.createdAt,
      authorName: n.authorName,
    })
  })

  ;(payments ?? []).forEach((p) => {
    events.push({
      id: p.id,
      inquiryId: p.inquiryId,
      type: 'payment',
      description: p.stripeLinkUrl
        ? `Payment link created ($${p.amount})`
        : `Payment ${p.status}`,
      createdAt: p.createdAt,
    })
  })

  events.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  return events
}
