/**
 * Mock inquiries for Host Listing Detail when Supabase returns empty.
 * Used for demo/development; production uses Supabase inquiries table.
 */

import type { HostListingInquiry } from '@/types/host-listing-detail'

/** Mock inquiries keyed by listing_id */
export const mockInquiriesByListing: Record<string, HostListingInquiry[]> = {
  '1': [
    {
      id: 'inq-1a',
      listing_id: '1',
      guest_name: 'Sarah M.',
      guest_email: null,
      start_date: '2025-06-15',
      end_date: '2025-06-22',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      message_preview:
        'We are interested in a week-long stay for our anniversary. Would love to know availability and if you offer private dining experiences.',
      reference: 'RR-A3K9XM2P',
      status: 'new',
    },
    {
      id: 'inq-1b',
      listing_id: '1',
      guest_name: 'James K.',
      guest_email: null,
      start_date: '2025-07-10',
      end_date: '2025-07-17',
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      message_preview:
        'Looking for a family reunion in July. Party of 6 adults and 2 children. Interested in the infinity pool and concierge services.',
      reference: 'RR-B7N2QK4R',
      status: 'contacted',
    },
  ],
  '2': [
    {
      id: 'inq-2a',
      listing_id: '2',
      guest_name: 'Emma L.',
      guest_email: null,
      start_date: '2025-12-20',
      end_date: '2025-12-28',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      message_preview:
        'Planning a ski trip for the holidays. Would like to know about ski-in access and chef availability during our stay.',
      reference: 'RR-C8P3RM5T',
      status: 'new',
    },
  ],
  '3': [],
  '4': [
    {
      id: 'inq-4a',
      listing_id: '4',
      guest_name: 'Michael R.',
      guest_email: null,
      start_date: '2025-05-01',
      end_date: '2025-05-08',
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      message_preview:
        'Interested in the lemon grove walk and Amalfi coast experience. Can you provide more details on the private boat charter?',
      reference: 'RR-D4S6TN7W',
      status: 'deposit_paid',
    },
  ],
  '5': [],
  '5-draft': [],
  '6': [],
}

/** Get mock inquiries for a listing; returns empty array if none */
export function getMockInquiriesForListing(listingId: string): HostListingInquiry[] {
  const list = mockInquiriesByListing[listingId] ?? []
  return Array.isArray(list) ? [...list] : []
}

/** Get mock full inquiry detail for modal */
export function getMockInquiryDetail(
  listingId: string,
  inquiryId: string
): { full_message: string; guest_name: string } | null {
  const list = mockInquiriesByListing[listingId] ?? []
  const inquiry = Array.isArray(list)
    ? list.find((i) => i.id === inquiryId)
    : null
  if (!inquiry) return null
  return {
    full_message:
      inquiry.message_preview +
      '\n\n' +
      '— Additional details can be discussed with our concierge team. We look forward to welcoming you.',
    guest_name: inquiry.guest_name ?? 'Guest',
  }
}
