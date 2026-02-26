import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Inquiry, PaymentState } from '@/types'

export type InquiryHistoryStatusFilter = '' | 'Paid' | 'Pending' | 'Cancelled'

export interface GuestInquiryHistoryFilters {
  status: InquiryHistoryStatusFilter
  fromDate: string | null
  toDate: string | null
  page: number
  pageSize: number
}

const PAGE_SIZE = 10

function getPaymentState(inquiry: Inquiry): PaymentState {
  if (inquiry.payment_state) return inquiry.payment_state
  if (inquiry.status === 'cancelled') return 'cancelled'
  if (inquiry.status === 'deposit_paid' || inquiry.status === 'confirmed')
    return 'paid'
  return 'pending'
}

function mapToDisplayStatus(inquiry: Inquiry): 'Paid' | 'Pending' | 'Cancelled' {
  const state = getPaymentState(inquiry)
  return state === 'paid' ? 'Paid' : state === 'cancelled' ? 'Cancelled' : 'Pending'
}

const STATUS_TO_DB: Record<string, string> = {
  Paid: 'paid',
  Pending: 'pending',
  Cancelled: 'cancelled',
}

async function fetchGuestInquiries(
  userId: string,
  filters: GuestInquiryHistoryFilters
): Promise<{ data: Inquiry[]; total: number }> {
  try {
    let query = supabase
      .from('inquiries')
      .select('*, listing:listings(*)', { count: 'exact' })
      .eq('guest_id', userId)
      .order('created_at', { ascending: false })

    if (filters.status && STATUS_TO_DB[filters.status]) {
      query = query.eq('payment_state', STATUS_TO_DB[filters.status])
    }
    if (filters.fromDate) {
      query = query.gte('created_at', filters.fromDate)
    }
    if (filters.toDate) {
      const toEndOfDay = new Date(filters.toDate)
      toEndOfDay.setHours(23, 59, 59, 999)
      query = query.lte('created_at', toEndOfDay.toISOString())
    }

    const from = (filters.page - 1) * filters.pageSize
    const to = from + filters.pageSize - 1
    const { data, error, count } = await query.range(from, to)

    if (error) return { data: [], total: 0 }

    const rawList = data ?? []
    const list = Array.isArray(rawList) ? rawList : []
    const total = typeof count === 'number' ? count : list.length
    const inquiries = list as Inquiry[]

    return { data: inquiries, total }
  } catch {
    return { data: [], total: 0 }
  }
}

export function useGuestInquiryHistory(
  userId: string | undefined,
  filters: GuestInquiryHistoryFilters
) {
  return useQuery({
    queryKey: ['guest', 'inquiry-history', userId, filters],
    queryFn: () =>
      userId ? fetchGuestInquiries(userId, filters) : Promise.resolve({ data: [], total: 0 }),
    enabled: !!userId,
    placeholderData: (prev) => prev,
  })
}

export { getPaymentState, mapToDisplayStatus, PAGE_SIZE }
