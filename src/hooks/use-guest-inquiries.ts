/**
 * React Query hook for guest inquiry history with filters and pagination.
 */

import { useQuery } from '@tanstack/react-query'
import {
  fetchGuestInquiries,
  type GuestInquiriesFilters,
} from '@/api/guest-inquiries'

const QUERY_KEY = ['guest', 'inquiries']

export function useGuestInquiries(
  guestId: string | undefined,
  filters: GuestInquiriesFilters
) {
  return useQuery({
    queryKey: [...QUERY_KEY, guestId, filters],
    queryFn: () =>
      guestId
        ? fetchGuestInquiries(guestId, filters)
        : Promise.resolve({ data: [], total: 0 }),
    enabled: !!guestId,
  })
}
