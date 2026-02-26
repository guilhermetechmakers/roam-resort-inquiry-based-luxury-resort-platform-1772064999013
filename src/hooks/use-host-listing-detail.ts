/**
 * React Query hooks for Host Listing Detail (Read-Only Inquiries) page.
 * Null-safe data fetching with loading and error states.
 */

import { useQuery } from '@tanstack/react-query'
import {
  fetchHostListingById,
  fetchHostListingInquiries,
  fetchHostInquiryDetail,
} from '@/api/host-listing-detail'

/** Fetch listing detail for host read-only view */
export function useHostListingDetail(listingId: string | undefined) {
  return useQuery({
    queryKey: ['host', 'listing', 'detail', listingId],
    queryFn: () =>
      listingId ? fetchHostListingById(listingId) : Promise.resolve(null),
    enabled: !!listingId,
  })
}

/** Fetch inquiries for a listing (read-only list) */
export function useHostListingInquiriesDetail(listingId: string | undefined) {
  return useQuery({
    queryKey: ['host', 'listing', 'inquiries', 'detail', listingId],
    queryFn: () =>
      listingId ? fetchHostListingInquiries(listingId) : Promise.resolve([]),
    enabled: !!listingId,
  })
}

/** Fetch full inquiry detail for modal (lazy when modal opens) */
export function useHostInquiryDetail(
  listingId: string | undefined,
  inquiryId: string | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['host', 'listing', 'inquiry', 'detail', listingId, inquiryId],
    queryFn: () =>
      listingId && inquiryId
        ? fetchHostInquiryDetail(listingId, inquiryId)
        : Promise.resolve(null),
    enabled: !!listingId && !!inquiryId && enabled,
  })
}
