/**
 * Admin inquiry hooks with server-side filters and pagination.
 * Uses fetchAdminInquiries from admin API.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchAdminInquiries,
  fetchListingsForFilter,
  fetchHostsForFilter,
  bulkUpdateInquiryStatus,
  type AdminInquiryFilters,
} from '@/api/admin'
export function useAdminInquiriesPaginated(filters: AdminInquiryFilters = {}) {
  return useQuery({
    queryKey: ['admin-inquiries', filters],
    queryFn: () => fetchAdminInquiries(filters),
    placeholderData: (prev) => prev,
  })
}

export function useAdminDestinations() {
  return useQuery({
    queryKey: ['admin-destinations'],
    queryFn: fetchListingsForFilter,
  })
}

export function useAdminHosts() {
  return useQuery({
    queryKey: ['admin-hosts'],
    queryFn: fetchHostsForFilter,
  })
}

export function useBulkUpdateInquiryStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      bulkUpdateInquiryStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] })
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
    },
  })
}
