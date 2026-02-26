import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { DestinationSortOption } from '@/types'

export interface DestinationFiltersFromUrl {
  query: string
  region: string
  style: string
  tags: string[]
  sort: DestinationSortOption
  page: number
}

const DEFAULT_SORT: DestinationSortOption = 'newest'

function parseTags(val: string | null): string[] {
  if (!val) return []
  const arr = val.split(',').map((s) => s.trim()).filter(Boolean)
  return arr
}

function serializeTags(tags: string[]): string {
  const arr = Array.isArray(tags) ? tags : []
  return arr.filter(Boolean).join(',')
}

export function useDestinationFiltersFromUrl(): [
  DestinationFiltersFromUrl,
  (updates: Partial<DestinationFiltersFromUrl>) => void,
] {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo((): DestinationFiltersFromUrl => {
    const q = searchParams.get('q')?.trim() ?? ''
    const region = searchParams.get('region')?.trim() ?? ''
    const style = searchParams.get('style')?.trim() ?? ''
    const tags = parseTags(searchParams.get('tags'))
    const sort = (searchParams.get('sort') as DestinationSortOption) ?? DEFAULT_SORT
    const pageRaw = searchParams.get('page')
    const page = Math.max(1, parseInt(pageRaw ?? '1', 10) || 1)

    return {
      query: q,
      region,
      style,
      tags,
      sort: ['newest', 'popularity', 'alphabetical'].includes(sort) ? sort : DEFAULT_SORT,
      page,
    }
  }, [searchParams])

  const setFilters = useCallback(
    (updates: Partial<DestinationFiltersFromUrl>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const merged = { ...filters, ...updates }

          if (merged.query) next.set('q', merged.query)
          else next.delete('q')

          if (merged.region) next.set('region', merged.region)
          else next.delete('region')

          if (merged.style) next.set('style', merged.style)
          else next.delete('style')

          if (merged.tags?.length) next.set('tags', serializeTags(merged.tags))
          else next.delete('tags')

          if (merged.sort && merged.sort !== DEFAULT_SORT) next.set('sort', merged.sort)
          else next.delete('sort')

          if (merged.page && merged.page > 1) next.set('page', String(merged.page))
          else next.delete('page')

          return next
        },
        { replace: true }
      )
    },
    [filters, setSearchParams]
  )
  return [filters, setFilters]
}
