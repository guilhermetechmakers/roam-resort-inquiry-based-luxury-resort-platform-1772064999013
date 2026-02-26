/**
 * API for Host Listing Detail (Read-Only Inquiries) page.
 * GET /host/listings/{listingId}
 * GET /host/listings/{listingId}/inquiries
 * GET /host/listings/{listingId}/inquiries/{inquiryId}
 *
 * Uses Supabase when configured; falls back to mock data.
 */

import { supabase } from '@/lib/supabase'
import type { Listing } from '@/types'
import type {
  HostListingDetail,
  HostListingInquiry,
  HostInquiryDetail,
  ImageItem,
} from '@/types/host-listing-detail'
import { mockListings } from '@/data/mock-listings'
import {
  getMockInquiriesForListing,
  getMockInquiryDetail,
} from '@/data/mock-inquiries'

async function getCurrentUserId(): Promise<string> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const id = session?.user?.id
    if (id) return id
  } catch {
    // Fallback for demo without auth
  }
  return 'host-1'
}

/** Map Listing to HostListingDetail shape with null-safe defaults */
function mapListingToDetail(listing: Listing | null): HostListingDetail | null {
  if (!listing) return null

  const galleryUrls = listing.gallery_urls ?? []
  const imageGallery: ImageItem[] = Array.isArray(galleryUrls)
    ? galleryUrls.map((url, i) => ({
        id: `img-${i}`,
        url: typeof url === 'string' ? url : '',
        altText: listing.title ?? 'Gallery image',
        priority: i,
      }))
    : []

  const status = listing.status === 'live' ? 'Live' : 'Draft'

  return {
    id: listing.id,
    host_id: listing.host_id ?? '',
    title: listing.title ?? 'Untitled',
    status,
    publish_date: listing.published_at ?? null,
    cover_image_url:
      listing.hero_image_url ??
      (Array.isArray(galleryUrls) && galleryUrls.length > 0 ? galleryUrls[0] : null),
    editorial_content: listing.editorial_content ?? null,
    image_gallery: imageGallery,
    last_updated: listing.updated_at ?? listing.created_at ?? new Date().toISOString(),
    visibility: status,
    slug: listing.slug,
    subtitle: listing.subtitle,
    region: listing.region,
    style: listing.style,
    gallery_urls: galleryUrls,
    editorial_content_raw: listing.editorial_content ?? undefined,
  }
}

/**
 * Fetch listing by ID for host (read-only detail view).
 * Validates host has access to the listing.
 */
export async function fetchHostListingById(
  listingId: string
): Promise<HostListingDetail | null> {
  const hostId = await getCurrentUserId()

  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .eq('host_id', hostId)
      .single()

    if (!error && data) {
      return mapListingToDetail(data as Listing)
    }
  } catch {
    // Fallback to mock
  }

  const mock = mockListings.find(
    (l) => l.id === listingId && l.host_id === hostId
  )
  if (mock) return mapListingToDetail(mock)

  // Allow viewing any mock listing for demo (host-1 owns most)
  const anyMock = mockListings.find((l) => l.id === listingId)
  if (anyMock) return mapListingToDetail(anyMock)

  return null
}

/** Map Supabase inquiry row to HostListingInquiry */
function mapInquiryRow(row: Record<string, unknown>): HostListingInquiry {
  return {
    id: String(row.id ?? ''),
    listing_id: String(row.listing_id ?? ''),
    guest_name: String(row.guest_name ?? row.guest_id ?? 'Guest'),
    guest_email: (row.guest_email as string) ?? null,
    start_date: String(row.start_date ?? row.check_in ?? ''),
    end_date: String(row.end_date ?? row.check_out ?? ''),
    created_at: String(row.created_at ?? ''),
    message_preview: String(
      (row.message_preview ?? row.message ?? '') as string
    ).slice(0, 200),
    reference: row.reference as string | undefined,
    status: (row.status as string) ?? null,
  }
}

/**
 * Fetch inquiries for a listing (read-only).
 * Returns array; use (data ?? []) when consuming.
 */
export async function fetchHostListingInquiries(
  listingId: string
): Promise<HostListingInquiry[]> {
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('id, listing_id, guest_name, guest_email, check_in, check_out, created_at, message, reference, status')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })

    if (!error && Array.isArray(data)) {
      const rows = (data ?? []) as Record<string, unknown>[]
      return rows.map((row) => {
        const r = row as Record<string, unknown>
        return mapInquiryRow({
          ...r,
          start_date: r.check_in ?? r.start_date,
          end_date: r.check_out ?? r.end_date,
          message_preview: r.message ?? r.message_preview,
        } as Record<string, unknown>)
      })
    }
  } catch {
    // Fallback to mock
  }

  return getMockInquiriesForListing(listingId)
}

/**
 * Fetch full inquiry detail for modal (read-only).
 * Used when opening MessageModal to view full message.
 */
export async function fetchHostInquiryDetail(
  listingId: string,
  inquiryId: string
): Promise<HostInquiryDetail | null> {
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('id, listing_id, guest_name, guest_email, check_in, check_out, created_at, message, reference')
      .eq('id', inquiryId)
      .eq('listing_id', listingId)
      .single()

    if (!error && data) {
      const row = data as Record<string, unknown>
      return {
        id: String(row.id ?? ''),
        listing_id: String(row.listing_id ?? ''),
        guest_name: String(row.guest_name ?? row.guest_id ?? 'Guest'),
        guest_email: (row.guest_email as string) ?? null,
        start_date: String(row.check_in ?? row.start_date ?? ''),
        end_date: String(row.check_out ?? row.end_date ?? ''),
        created_at: String(row.created_at ?? ''),
        full_message: String(row.message ?? ''),
        reference: row.reference as string | undefined,
      }
    }
  } catch {
    // Fallback to mock
  }

  const mock = getMockInquiryDetail(listingId, inquiryId)
  if (!mock) return null

  const inquiries = getMockInquiriesForListing(listingId)
  const inquiry = Array.isArray(inquiries)
    ? inquiries.find((i) => i.id === inquiryId)
    : null

  return {
    id: inquiryId,
    listing_id: listingId,
    guest_name: mock.guest_name,
    guest_email: null,
    start_date: inquiry?.start_date ?? '',
    end_date: inquiry?.end_date ?? '',
    created_at: inquiry?.created_at ?? new Date().toISOString(),
    full_message: mock.full_message,
    reference: inquiry?.reference,
  }
}
