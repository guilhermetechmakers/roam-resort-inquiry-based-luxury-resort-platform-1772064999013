import { useQuery } from '@tanstack/react-query'
import {
  fetchHostListings,
  fetchListingInquiries,
  fetchHostStats,
  type HostListingsOptions,
} from '@/api/host-dashboard'
import { supabase } from '@/lib/supabase'

async function getHostId(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const id = session?.user?.id
    if (id) return id
  } catch {
    // Fallback for demo without auth
  }
  return 'host-1'
}

export function useHostListings(options: HostListingsOptions = {}) {
  return useQuery({
    queryKey: ['host', 'listings', options],
    queryFn: async () => {
      const hostId = await getHostId()
      return fetchHostListings(hostId, options)
    },
  })
}

export function useListingInquiries(listingId: string | undefined) {
  return useQuery({
    queryKey: ['host', 'listing', 'inquiries', listingId],
    queryFn: () =>
      listingId ? fetchListingInquiries(listingId) : Promise.resolve([]),
    enabled: !!listingId,
  })
}

export function useHostStats(hostId?: string) {
  return useQuery({
    queryKey: ['host', 'stats', hostId],
    queryFn: async () => {
      const id = hostId ?? (await getHostId())
      return fetchHostStats(id)
    },
  })
}
