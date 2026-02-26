/**
 * Guest inquiries API - fetch inquiry history with filters and pagination.
 * Uses Supabase directly; guards all array results per runtime safety rules.
 */

import { supabase } from '@/lib/supabase'
import type { Inquiry } from '@/types'

export type InquiryStatusFilter = '' | 'all' | 'paid' | 'pending' | 'cancelled'

export interface GuestInquiriesFilters {
  status: InquiryStatusFilter
  fromDate: string | null
  toDate: string | null
  page: number
  pageSize: number
}

export interface GuestInquiriesResponse {
  data: Inquiry[]
  total: number
}

/**
 * Fetch guest inquiries with optional filters and pagination.
 * Returns { data, total } with runtime-safe arrays.
 */
export async function fetchGuestInquiries(
  guestId: string,
  filters: GuestInquiriesFilters
): Promise<GuestInquiriesResponse> {
  try {
    let query = supabase
      .from('inquiries')
      .select('*, listing:listings(*)', { count: 'exact' })
      .eq('guest_id', guestId)
      .order('created_at', { ascending: false })

    if (filters.fromDate) {
      query = query.gte('created_at', filters.fromDate)
    }
    if (filters.toDate) {
      const endOfDay = new Date(filters.toDate)
      endOfDay.setHours(23, 59, 59, 999)
      query = query.lte('created_at', endOfDay.toISOString())
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('payment_state', filters.status)
    }

    const from = (filters.page - 1) * filters.pageSize
    const to = from + filters.pageSize - 1
    query = query.range(from, to)

    const { data: rawData, error, count } = await query

    if (error) {
      return { data: [], total: 0 }
    }

    const items = Array.isArray(rawData) ? rawData : []
    const totalFromDb = typeof count === 'number' ? count : items.length
    const paginated = items as Inquiry[]

    return {
      data: paginated ?? [],
      total: totalFromDb ?? 0,
    }
  } catch {
    return { data: [], total: 0 }
  }
}
