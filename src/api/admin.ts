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
} from '@/types/admin'

/** Map inquiry status to display format */
function toDisplayStatus(status: string): string {
  const map: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    deposit_paid: 'Deposit Paid',
    confirmed: 'Confirmed',
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

/** Fetch admin inquiries with optional filters */
export async function fetchAdminInquiries(filters?: {
  status?: string
  destination?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ data: AdminInquiry[]; total: number }> {
  try {
    let query = supabase
      .from('inquiries')
      .select('*, listing:listings(*), guest:users(*)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }
    if (filters?.destination) {
      query = query.eq('listing_id', filters.destination)
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }
    if (filters?.search) {
      const term = filters.search.trim()
      if (term) {
        query = query.ilike('reference', `%${term}%`)
      }
    }

    const page = filters?.page ?? 1
    const pageSize = filters?.pageSize ?? 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) return { data: [], total: 0 }
    const list = Array.isArray(data) ? data : []
    const shaped = list.map((row) => shapeInquiryToAdmin(row as Inquiry))
    return { data: shaped, total: count ?? shaped.length }
  } catch {
    return { data: [], total: 0 }
  }
}

/** Mock reconciliations (no Supabase table yet) */
export async function fetchAdminReconciliations(
  _filters?: AdminExportFilters
): Promise<{ data: AdminReconciliation[]; total: number }> {
  // Placeholder: return empty until reconciliation table exists
  return { data: [], total: 0 }
}

/** Compute dashboard metrics from inquiries */
export function computeDashboardMetrics(inquiries: Inquiry[]): AdminDashboardMetrics {
  const list = inquiries ?? []
  const newInquiries = list.filter((i) => i.status === 'new').length
  const pendingPayments = list.filter(
    (i) => i.payment_state === 'pending' || !i.payment_state
  ).length
  const confirmed = list.filter((i) => i.status === 'confirmed').length
  const revenue = list.reduce((sum, i) => sum + (i.total_amount ?? 0), 0)
  // Placeholder: avg response time (would need activity/response timestamps)
  const avgResponseTimeHours = 24

  return {
    newInquiries,
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
