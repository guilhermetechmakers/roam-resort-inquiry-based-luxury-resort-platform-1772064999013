import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import {
  fetchPublishedDestinations,
  fetchFeaturedEditorial,
  fetchRelatedDestinations,
  type FetchDestinationsParams,
} from '@/api/destinations'

const PAGE_SIZE = 12

export function useDestinations(params: FetchDestinationsParams = {}) {
  return useQuery({
    queryKey: ['destinations', params],
    queryFn: () => fetchPublishedDestinations(params),
  })
}

export function useInfiniteDestinations(
  filters: Omit<FetchDestinationsParams, 'page' | 'pageSize'>
) {
  return useInfiniteQuery({
    queryKey: ['destinations', 'infinite', filters],
    queryFn: ({ pageParam = 1 }) =>
      fetchPublishedDestinations({
        ...filters,
        page: pageParam,
        pageSize: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + (p.data?.length ?? 0), 0)
      return loaded < (lastPage.total ?? 0) ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
  })
}

export function useFeaturedEditorial() {
  return useQuery({
    queryKey: ['editorial', 'featured'],
    queryFn: fetchFeaturedEditorial,
  })
}

export function useRelatedDestinations(excludeId: string | undefined, limit = 4) {
  return useQuery({
    queryKey: ['destinations', 'related', excludeId, limit],
    queryFn: () => (excludeId ? fetchRelatedDestinations(excludeId, limit) : []),
    enabled: !!excludeId,
  })
}
