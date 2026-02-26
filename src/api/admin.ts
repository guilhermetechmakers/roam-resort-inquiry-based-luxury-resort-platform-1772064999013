/**
 * Admin API layer for Concierge Dashboard.
 * Fetches inquiries, reconciliations; supports export.
 * Uses Supabase for inquiries; mock data for reconciliations until backend exists.
 */

import { supabase } from '@/lib/supabase'
import type { Inquiry } from '@/types'
import type {
  AdminInquiry,
  AdminReconciliation,
  AdminDashboardMetrics,
  AdminExportFilters,
  AdminInternalNote,
  AdminTimelineEvent,
  AdminInquiryDetail,
  AdminPayment,
  StripeLinkPayload,
} from '@/types/admin'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''

/** Map inquiry status to display format */
function toDisplayStatus(status: string): string {
  const map: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    in_review: 'In Review',
    deposit_paid: 'Deposit Paid',
    confirmed: 'Confirmed',
    closed: 'Closed',
    cancelled: 'Cancelled',
  }
  return map[status] ?? status
}

/** Map payment state to display */
function toPaymentStatus(paymentState?: string): string {
  const map: Record<string, string> = {
    paid: 'Paid',
    pending: 'Pending',
    cancelled: 'Refunded',
  }
  return map[paymentState ?? 'pending'] ?? 'Pending'
}

/** Shape raw Inquiry to AdminInquiry */
export function shapeInquiryToAdmin(i: Inquiry): AdminInquiry {
  const listing = typeof i.listing === 'object' ? i.listing : null
  const guest = typeof i.guest === 'object' ? i.guest : null
  const guestName =
    guest?.full_name ?? guest?.email ?? 'Guest'
  const destinationName = listing?.title ?? 'Destination'
  const dates = {
    start: i.check_in ?? '',
    end: i.check_out ?? '',
  }
  return {
    id: i.id,
    guestName,
    destinationId: i.listing_id ?? '',
    destinationName,
    dates,
    guests: i.guests_count ?? 0,
    status: toDisplayStatus(i.status) as AdminInquiry['status'],
    paymentStatus: toPaymentStatus(i.payment_state) as AdminInquiry['paymentStatus'],
    amount: i.total_amount ?? 0,
    currency: 'USD',
    createdAt: i.created_at ?? '',
    updatedAt: i.updated_at ?? '',
    notes: Array.isArray(i.internal_notes)
      ? (i.internal_notes as string[])
      : typeof i.internal_notes === 'string'
        ? [i.internal_notes]
        : [],
    reference: i.reference,
  }
}

export interface AdminInquiryFilters {
  status?: string
  destination_id?: string
  /** @deprecated Use destination_id */
  destination?: string
  host_id?: string
  guest_email?: string
  dateFrom?: string
  dateTo?: string
  start_date?: string
  end_date?: string
  search?: string
  q?: string
  page?: number
  pageSize?: number
}

/** Fetch admin inquiries with optional filters and pagination. Returns raw Inquiry[] for list display. */
export async function fetchAdminInquiries(filters?: AdminInquiryFilters): Promise<{
  data: Inquiry[]
  total: number
}> {
  try {
    let query = supabase
      .from('inquiries')
      .select('*, listing:listings(*), guest:profiles(*)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }
    const destId = filters?.destination_id ?? filters?.destination
    if (destId) {
      query = query.eq('listing_id', destId)
    }
    if (filters?.host_id) {
      const { data: listingIds } = await supabase
        .from('listings')
        .select('id')
        .eq('host_id', filters.host_id)
      const ids = Array.isArray(listingIds) ? listingIds.map((l) => l.id) : []
      if (ids.length > 0) {
        query = query.in('listing_id', ids)
      } else {
        return { data: [], total: 0 }
      }
    }
    if (filters?.guest_email?.trim()) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', `%${filters.guest_email.trim()}%`)
      const guestIds = Array.isArray(profiles) ? profiles.map((p) => p.id) : []
      if (guestIds.length > 0) {
        query = query.in('guest_id', guestIds)
      } else {
        return { data: [], total: 0 }
      }
    }
    const dateFrom = filters?.dateFrom ?? filters?.start_date
    const dateTo = filters?.dateTo ?? filters?.end_date
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', `${dateTo}T23:59:59.999Z`)
    }
    const searchTerm = (filters?.search ?? filters?.q)?.trim()
    if (searchTerm) {
      const term = searchTerm
      const { data: listings } = await supabase
        .from('listings')
        .select('id')
        .or(`title.ilike.%${term}%,slug.ilike.%${term}%`)
      const listingIds = Array.isArray(listings) ? listings.map((l) => l.id) : []
      if (listingIds.length > 0) {
        query = query.or(`reference.ilike.%${term}%,listing_id.in.(${listingIds.join(',')})`)
      } else {
        query = query.ilike('reference', `%${term}%`)
      }
    }

    const page = Math.max(1, filters?.page ?? 1)
    const pageSize = Math.min(1000, Math.max(10, filters?.pageSize ?? 20))
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) return { data: [], total: 0 }
    const list = Array.isArray(data) ? data : []
    return { data: list as Inquiry[], total: count ?? list.length }
  } catch {
    return { data: [], total: 0 }
  }
}

/** Fetch listings for destination filter dropdown */
export async function fetchListingsForFilter(): Promise<Array<{ id: string; title: string }>> {
  const { data, error } = await supabase
    .from('listings')
    .select('id, title')
    .order('title')
  if (error) return []
  return Array.isArray(data) ? data : []
}

/** Fetch hosts for host filter dropdown (profiles with host role) */
export async function fetchHostsForFilter(): Promise<Array<{ id: string; full_name: string; email: string }>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'host')
    .order('full_name')
  if (error) return []
  const list = Array.isArray(data) ? data : []
  return list.map((p: { id: string; full_name?: string; email?: string }) => ({
    id: p.id,
    full_name: p.full_name ?? p.email ?? 'Host',
    email: p.email ?? '',
  }))
}

/** Parse internal notes from inquiry (stored as JSON string) */
function parseInternalNotes(inquiry: Inquiry): AdminInternalNote[] {
  const raw = inquiry.internal_notes
  if (!raw) return []
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    const arr = Array.isArray(parsed) ? parsed : []
    return arr.map((n: { id?: string; authorName?: string; text?: string; note?: string; createdAt?: string }, i: number) => ({
      id: n.id ?? `note-${i}`,
      inquiryId: inquiry.id,
      note: n.text ?? n.note ?? '',
      authorId: '',
      authorName: n.authorName ?? 'Staff',
      createdAt: n.createdAt ?? new Date().toISOString(),
    }))
  } catch {
    return []
  }
}

/** Build synthetic timeline from inquiry and notes */
function buildTimelineEvents(inquiry: Inquiry, notes: AdminInternalNote[]): AdminTimelineEvent[] {
  const events: AdminTimelineEvent[] = []
  const created = inquiry.created_at ?? ''
  if (created) {
    events.push({
      id: 'evt-created',
      inquiryId: inquiry.id,
      type: 'status',
      description: 'Inquiry created',
      createdAt: created,
    })
  }
  const updated = inquiry.updated_at ?? ''
  if (updated && updated !== created) {
    events.push({
      id: 'evt-updated',
      inquiryId: inquiry.id,
      type: 'status',
      description: `Status: ${(inquiry.status ?? '').replace('_', ' ')}`,
      createdAt: updated,
    })
  }
  ;(notes ?? []).forEach((n) => {
    events.push({
      id: `evt-note-${n.id}`,
      inquiryId: inquiry.id,
      type: 'note',
      description: n.note?.slice(0, 80) ?? 'Note added',
      createdAt: n.createdAt ?? '',
      authorName: n.authorName,
    })
  })
  if (inquiry.payment_link) {
    events.push({
      id: 'evt-payment',
      inquiryId: inquiry.id,
      type: 'payment',
      description: 'Payment link created',
      createdAt: inquiry.updated_at ?? inquiry.created_at ?? '',
    })
  }
  return events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

/** Shape Inquiry to AdminInquiryDetail */
function shapeInquiryToDetail(i: Inquiry): AdminInquiryDetail {
  const base = shapeInquiryToAdmin(i)
  const guest = typeof i.guest === 'object' ? i.guest : null
  const notes = parseInternalNotes(i)
  const timelineEvents = buildTimelineEvents(i, notes)
  const attachments: { id: string; name: string; url: string }[] = []
  const rawAttachments = i.attachments ?? []
  if (Array.isArray(rawAttachments)) {
    rawAttachments.forEach((a, idx) => {
      if (typeof a === 'object' && a && 'file_url' in a) {
        const att = a as { id?: string; name?: string; file_url?: string }
        attachments.push({
          id: att.id ?? `att-${idx}`,
          name: att.name ?? 'Attachment',
          url: att.file_url ?? '',
        })
      } else if (typeof a === 'string') {
        attachments.push({ id: `att-${idx}`, name: 'Attachment', url: a })
      }
    })
  }
  const payments: AdminPayment[] = []
  if (i.payment_link || i.total_amount) {
    payments.push({
      id: 'pay-1',
      inquiryId: i.id,
      stripeLinkUrl: i.payment_link,
      amount: i.total_amount ?? 0,
      currency: 'USD',
      status: i.payment_state === 'paid' ? 'paid' : i.payment_link ? 'link_created' : 'pending',
      createdAt: i.updated_at ?? i.created_at ?? '',
    })
  }
  return {
    ...base,
    rawStatus: i.status ?? 'new',
    guestEmail: guest?.email ?? '',
    guestPhone: (guest as { phone?: string })?.phone ?? '',
    guestMessage: i.message ?? '',
    attachments,
    internalNotes: notes,
    timelineEvents,
    payments,
  }
}

/** Fetch single admin inquiry by ID */
export async function fetchAdminInquiryDetail(inquiryId: string): Promise<AdminInquiryDetail | null> {
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*, listing:listings(*), guest:profiles(*)')
      .eq('id', inquiryId)
      .single()

    if (error || !data) return null
    return shapeInquiryToDetail(data as Inquiry)
  } catch {
    return null
  }
}

const ALLOWED_STATUSES = [
  'new',
  'contacted',
  'in_review',
  'deposit_paid',
  'confirmed',
  'closed',
  'cancelled',
] as const

function isValidStatus(s: string): boolean {
  return ALLOWED_STATUSES.includes(s as (typeof ALLOWED_STATUSES)[number])
}

/** Bulk update inquiry statuses */
export async function bulkUpdateInquiryStatus(
  ids: string[],
  status: string
): Promise<{ updated: number; failed: string[] }> {
  if (!isValidStatus(status)) {
    throw new Error('Invalid status value')
  }
  const validIds = (ids ?? []).filter((id) => typeof id === 'string' && id.length > 0)
  if (validIds.length === 0) {
    return { updated: 0, failed: [] }
  }
  const { data, error } = await supabase
    .from('inquiries')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .in('id', validIds)
    .select('id')

  if (error) throw new Error(error.message ?? 'Failed to bulk update')
  const updated = Array.isArray(data) ? data.length : 0
  const updatedIds = new Set((data ?? []).map((r: { id: string }) => r.id))
  const failed = validIds.filter((id) => !updatedIds.has(id))
  return { updated, failed }
}

/** Update inquiry status */
export async function updateAdminInquiryStatus(
  inquiryId: string,
  status: string
): Promise<AdminInquiryDetail | null> {
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', inquiryId)
      .select('*, listing:listings(*), guest:profiles(*)')
      .single()

    if (error || !data) return null
    return shapeInquiryToDetail(data as Inquiry)
  } catch {
    return null
  }
}

/** Create internal note (stores as JSON in inquiry.internal_notes) */
export async function createAdminInternalNote(
  inquiryId: string,
  text: string,
  authorName: string
): Promise<AdminInternalNote | null> {
  try {
    const { data: inquiry } = await supabase
      .from('inquiries')
      .select('internal_notes')
      .eq('id', inquiryId)
      .single()

    const existing = inquiry as { internal_notes?: string } | null
    const notes = parseInternalNotes({ ...existing, id: inquiryId } as Inquiry)
    const newNote: AdminInternalNote = {
      id: crypto.randomUUID(),
      inquiryId,
      note: text,
      authorId: '',
      authorName,
      createdAt: new Date().toISOString(),
    }
    notes.push(newNote)
    const payload = JSON.stringify(notes.map((n) => ({ id: n.id, authorName: n.authorName, text: n.note, createdAt: n.createdAt })))

    const { error } = await supabase
      .from('inquiries')
      .update({ internal_notes: payload, updated_at: new Date().toISOString() })
      .eq('id', inquiryId)

    if (error) return null
    return newNote
  } catch {
    return null
  }
}

/** Update internal note */
export async function updateAdminInternalNote(
  inquiryId: string,
  noteId: string,
  text: string
): Promise<boolean> {
  try {
    const { data: inquiry } = await supabase
      .from('inquiries')
      .select('internal_notes')
      .eq('id', inquiryId)
      .single()

    const existing = inquiry as { internal_notes?: string } | null
    const notes = parseInternalNotes({ ...existing, id: inquiryId } as Inquiry)
    const idx = notes.findIndex((n) => n.id === noteId)
    if (idx < 0) return false
    notes[idx] = { ...notes[idx], note: text }
    const payload = JSON.stringify(notes.map((n) => ({ id: n.id, authorName: n.authorName, text: n.note, createdAt: n.createdAt })))

    const { error } = await supabase
      .from('inquiries')
      .update({ internal_notes: payload, updated_at: new Date().toISOString() })
      .eq('id', inquiryId)

    return !error
  } catch {
    return false
  }
}

/** Delete internal note */
export async function deleteAdminInternalNote(
  inquiryId: string,
  noteId: string
): Promise<boolean> {
  try {
    const { data: inquiry } = await supabase
      .from('inquiries')
      .select('internal_notes')
      .eq('id', inquiryId)
      .single()

    const existing = inquiry as { internal_notes?: string } | null
    const notes = parseInternalNotes({ ...existing, id: inquiryId } as Inquiry).filter(
      (n) => n.id !== noteId
    )
    const payload = JSON.stringify(notes.map((n) => ({ id: n.id, authorName: n.authorName, text: n.note, createdAt: n.createdAt })))

    const { error } = await supabase
      .from('inquiries')
      .update({ internal_notes: payload, updated_at: new Date().toISOString() })
      .eq('id', inquiryId)

    return !error
  } catch {
    return false
  }
}

/** Create Stripe payment link via Edge Function */
export async function createStripePaymentLink(
  inquiryId: string,
  payload: StripeLinkPayload
): Promise<{ paymentLinkUrl: string } | null> {
  const url = `${SUPABASE_URL}/functions/v1/create-stripe-link`
  const { supabase } = await import('@/lib/supabase')
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ inquiryId, ...payload }),
  })
  const json = (await res.json().catch(() => ({}))) as { paymentLinkUrl?: string; error?: string }
  if (!res.ok || !json.paymentLinkUrl) return null

  // Persist payment link URL to inquiry
  await supabase
    .from('inquiries')
    .update({
      payment_link: json.paymentLinkUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', inquiryId)

  return { paymentLinkUrl: json.paymentLinkUrl }
}

/** Mark payment as received (updates inquiry payment_state) */
export async function markPaymentReceived(inquiryId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('inquiries')
      .update({ payment_state: 'paid', updated_at: new Date().toISOString() })
      .eq('id', inquiryId)
    return !error
  } catch {
    return false
  }
}

/** Export inquiry as CSV */
export function exportInquiryCsv(detail: AdminInquiryDetail): string {
  const rows = [
    ['Reference', detail.reference ?? ''],
    ['Guest Name', detail.guestName ?? ''],
    ['Guest Email', detail.guestEmail ?? ''],
    ['Guest Phone', detail.guestPhone ?? ''],
    ['Destination', detail.destinationName ?? ''],
    ['Check-in', detail.dates?.start ?? ''],
    ['Check-out', detail.dates?.end ?? ''],
    ['Guests', String(detail.guests ?? '')],
    ['Status', detail.status ?? ''],
    ['Amount', String(detail.amount ?? '')],
    ['Message', detail.guestMessage ?? ''],
    ['Created', detail.createdAt ?? ''],
    ['Updated', detail.updatedAt ?? ''],
  ]
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
}

/** Export inquiry as PDF (client-side: opens print dialog) */
export function printInquiryDetail(): void {
  window.print()
}

/** Mock reconciliations (no Supabase table yet) */
export async function fetchAdminReconciliations(
  _filters?: AdminExportFilters
): Promise<{ data: AdminReconciliation[]; total: number }> {
  // Placeholder: return empty until reconciliation table exists
  return { data: [], total: 0 }
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
const OVERDUE_HOURS = 48

/** Compute dashboard metrics from inquiries */
export function computeDashboardMetrics(inquiries: Inquiry[]): AdminDashboardMetrics {
  const list = inquiries ?? []
  const now = Date.now()
  const oneWeekAgo = now - ONE_WEEK_MS
  const overdueThreshold = now - OVERDUE_HOURS * 60 * 60 * 1000

  const totalInquiries = list.length
  const newInquiries = list.filter((i) => i.status === 'new').length
  const newThisWeek = list.filter((i) => {
    const created = new Date(i.created_at ?? 0).getTime()
    return created >= oneWeekAgo
  }).length
  const overdue = list.filter((i) => {
    if (i.status === 'closed' || i.status === 'cancelled' || i.status === 'confirmed') return false
    const created = new Date(i.created_at ?? 0).getTime()
    return created < overdueThreshold && i.status === 'new'
  }).length
  const unresolved = list.filter(
    (i) => i.status !== 'closed' && i.status !== 'cancelled'
  ).length
  const pendingPayments = list.filter(
    (i) => i.payment_state === 'pending' || !i.payment_state
  ).length
  const confirmed = list.filter((i) => i.status === 'confirmed').length
  const revenue = list.reduce((sum, i) => sum + (i.total_amount ?? 0), 0)
  const avgResponseTimeHours = 24

  return {
    totalInquiries,
    newInquiries,
    newThisWeek,
    overdue,
    unresolved,
    pendingPayments,
    confirmed,
    revenue,
    avgResponseTimeHours,
  }
}

/** Generate CSV string for inquiries */
export function generateInquiriesCsv(inquiries: AdminInquiry[]): string {
  const headers = [
    'Reference',
    'Guest Name',
    'Destination',
    'Check-in',
    'Check-out',
    'Guests',
    'Status',
    'Payment Status',
    'Amount',
    'Currency',
    'Created',
  ]
  const rows = (inquiries ?? []).map((i) => [
    escapeCsv(i.reference ?? ''),
    escapeCsv(i.guestName),
    escapeCsv(i.destinationName),
    escapeCsv(i.dates?.start ?? ''),
    escapeCsv(i.dates?.end ?? ''),
    String(i.guests ?? ''),
    escapeCsv(i.status),
    escapeCsv(i.paymentStatus),
    String(i.amount ?? ''),
    escapeCsv(i.currency ?? 'USD'),
    escapeCsv(i.createdAt ?? ''),
  ])
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

/** Generate CSV string for reconciliations */
export function generateReconciliationsCsv(
  reconciliations: AdminReconciliation[]
): string {
  const headers = [
    'ID',
    'Inquiry ID',
    'Amount',
    'Currency',
    'Status',
    'Reconciled At',
    'Notes',
  ]
  const rows = (reconciliations ?? []).map((r) => [
    escapeCsv(r.id),
    escapeCsv(r.inquiryId),
    String(r.amount ?? ''),
    escapeCsv(r.currency ?? ''),
    escapeCsv(r.status),
    escapeCsv(r.reconciledAt ?? ''),
    escapeCsv(Array.isArray(r.notes) ? r.notes.join('; ') : ''),
  ])
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

function escapeCsv(value: unknown): string {
  if (value == null) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/** Trigger CSV download */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
