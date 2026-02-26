import { supabase } from '@/lib/supabase'
import type { Listing } from '@/types'
import { mockListings } from '@/data/mock-listings'

export interface HostListingsOptions {
  status?: 'draft' | 'live' | 'all'
  search?: string
  sort?: 'updated_at' | 'status' | 'title'
}

export interface HostStats {
  totalInquiries: number
  totalViews: number
  lastInquiryDate: string | null
}

export interface InquirySummary {
  id: string
  reference: string
  status: string
  created_at: string
  message?: string
}

/**
 * Fetch listings for the current host with optional filters.
 */
export async function fetchHostListings(
  hostId: string,
  options: HostListingsOptions = {}
): Promise<Listing[]> {
  const { status = 'all', search = '', sort = 'updated_at' } = options

  try {
    let query = supabase
      .from('listings')
      .select('*')
      .eq('host_id', hostId)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (sort === 'updated_at') {
      query = query.order('updated_at', { ascending: false })
    } else if (sort === 'title') {
      query = query.order('title', { ascending: true })
    } else if (sort === 'status') {
      query = query.order('status', { ascending: true })
    }

    const { data, error } = await query

    if (!error && data?.length) {
      let list = (data ?? []) as Listing[]
      if (search.trim()) {
        const q = search.toLowerCase()
        list = list.filter(
          (l) =>
            l.title?.toLowerCase().includes(q) ||
            l.region?.toLowerCase().includes(q) ||
            l.subtitle?.toLowerCase().includes(q)
        )
      }
      return list
    }
  } catch {
    // Fallback to mock
  }

  let list = [...mockListings].filter((l) => l.host_id === hostId)

  if (status !== 'all') {
    list = list.filter((l) => l.status === status)
  }

  if (search.trim()) {
    const q = search.toLowerCase()
    list = list.filter(
      (l) =>
        l.title?.toLowerCase().includes(q) ||
        l.region?.toLowerCase().includes(q) ||
        (l.subtitle ?? '').toLowerCase().includes(q)
    )
  }

  if (sort === 'updated_at') {
    list.sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
  } else if (sort === 'title') {
    list.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
  } else if (sort === 'status') {
    list.sort((a, b) => (a.status ?? '').localeCompare(b.status ?? ''))
  }

  return list
}

/**
 * Fetch read-only inquiry summaries for a listing.
 */
export async function fetchListingInquiries(
  listingId: string
): Promise<InquirySummary[]> {
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('id, reference, status, created_at, message')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })

    if (!error && Array.isArray(data)) {
      return (data ?? []).map((row) => ({
        id: row.id,
        reference: row.reference ?? '',
        status: row.status ?? 'new',
        created_at: row.created_at ?? '',
        message: row.message,
      }))
    }
  } catch {
    // Fallback
  }
  return []
}

/**
 * Fetch aggregate stats for the host (inquiries, views, last inquiry date).
 */
export async function fetchHostStats(hostId: string): Promise<HostStats> {
  const defaults: HostStats = {
    totalInquiries: 0,
    totalViews: 0,
    lastInquiryDate: null,
  }

  try {
    const { data: listings } = await supabase
      .from('listings')
      .select('id')
      .eq('host_id', hostId)

    const listingIds = Array.isArray(listings)
      ? (listings ?? []).map((l) => l.id).filter(Boolean)
      : []

    if (listingIds.length === 0) return defaults

    const { data: inquiries } = await supabase
      .from('inquiries')
      .select('id, created_at')
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false })

    const inquiryList = Array.isArray(inquiries) ? (inquiries ?? []) : []
    const totalInquiries = inquiryList.length
    const lastInquiry =
      inquiryList.length > 0
        ? inquiryList.reduce<string | null>((latest, i) => {
            const d = i?.created_at ?? ''
            return !latest || d > latest ? d : latest
          }, null)
        : null

    let totalViews = 0
    try {
      const { data: viewsData } = await supabase
        .from('listing_views')
        .select('listing_id')
        .in('listing_id', listingIds)
      if (Array.isArray(viewsData)) {
        totalViews = (viewsData ?? []).length
      }
    } catch {
      // views table may not exist
    }

    return {
      totalInquiries,
      totalViews,
      lastInquiryDate: lastInquiry,
    }
  } catch {
    return defaults
  }
}
