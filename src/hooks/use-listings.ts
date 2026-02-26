import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Listing } from '@/types'
import { mockListings } from '@/data/mock-listings'

async function fetchListings(filters?: { region?: string; style?: string }): Promise<Listing[]> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'live')
      .order('created_at', { ascending: false })

    if (!error && data?.length) return data as Listing[]
  } catch {
    // Fallback to mock when Supabase not configured
  }
  let list = [...mockListings].filter((l) => l.status === 'live')
  if (filters?.region) list = list.filter((l) => l.region?.toLowerCase().includes(filters.region!.toLowerCase()))
  if (filters?.style) list = list.filter((l) => l.style?.toLowerCase().includes(filters.style!.toLowerCase()))
  return list
}

async function fetchListingBySlug(slugOrId: string): Promise<Listing | null> {
  try {
    const { data: bySlug } = await supabase
      .from('listings')
      .select('*')
      .eq('slug', slugOrId)
      .eq('status', 'live')
      .single()

    if (bySlug) return bySlug as Listing

    const { data: byId } = await supabase
      .from('listings')
      .select('*')
      .eq('id', slugOrId)
      .eq('status', 'live')
      .single()

    if (byId) return byId as Listing
  } catch {
    // Fallback to mock
  }
  return (
    mockListings.find((l) => l.slug === slugOrId) ??
    mockListings.find((l) => l.id === slugOrId) ??
    null
  )
}

export function useListings(filters?: { region?: string; style?: string }) {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: () => fetchListings(filters),
  })
}

export function useListing(slug: string | undefined) {
  return useQuery({
    queryKey: ['listing', slug],
    queryFn: () => (slug ? fetchListingBySlug(slug) : null),
    enabled: !!slug,
  })
}

async function fetchListingById(id: string): Promise<Listing | null> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()

    if (!error && data) return data as Listing
  } catch {
    // Fallback
  }
  return mockListings.find((l) => l.id === id) ?? null
}

export function useListingById(id: string | undefined) {
  return useQuery({
    queryKey: ['listing', 'id', id],
    queryFn: () => (id ? fetchListingById(id) : null),
    enabled: !!id,
  })
}
