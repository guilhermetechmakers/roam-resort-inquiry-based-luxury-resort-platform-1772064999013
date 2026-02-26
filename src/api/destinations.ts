import { supabase } from '@/lib/supabase'
import type { Destination, EditorialBlock, EditorialTeaser, DestinationCard, DestinationSortOption } from '@/types'
import { mockListings } from '@/data/mock-listings'
import { mockEditorialBlocks, mockEditorialTeasers } from '@/data/mock-editorial'

export interface FetchDestinationsParams {
  region?: string
  style?: string
  query?: string
  tags?: string[]
  sort?: DestinationSortOption
  page?: number
  pageSize?: number
}

export interface FetchDestinationsResponse {
  data: Destination[]
  total: number
}

/** Maps Listing to DestinationCard for landing carousel */
function listingToDestinationCard(listing: {
  id: string
  slug?: string
  title?: string
  subtitle?: string
  hero_image_url?: string
  gallery_urls?: string[]
  editorial_content?: string
}): DestinationCard {
  const snippet =
    listing.editorial_content?.split('\n')[0]?.replace(/^#+\s*/, '') ??
    listing.subtitle ??
    ''
  return {
    id: listing.id,
    name: listing.title ?? 'Untitled',
    slug: listing.slug ?? listing.id,
    imageUrl: listing.hero_image_url ?? listing.gallery_urls?.[0] ?? '',
    editorialSnippet: snippet,
    isHighlighted: true,
  }
}

/** Maps Listing to Destination for public catalog */
function listingToDestination(listing: {
  id: string
  slug?: string
  title?: string
  subtitle?: string
  region?: string
  style?: string
  tags?: string[] | null
  hero_image_url?: string
  gallery_urls?: string[]
  created_at?: string
  editorial_content?: string
}): Destination {
  const tags = listing.tags ?? []
  const tagsArr = Array.isArray(tags) ? tags : []
  return {
    id: listing.id,
    slug: listing.slug ?? undefined,
    title: listing.title ?? undefined,
    tagline: listing.subtitle ?? undefined,
    region: listing.region ?? undefined,
    style: listing.style ?? undefined,
    tags: tagsArr.length > 0 ? tagsArr : undefined,
    imageUrl: listing.hero_image_url ?? listing.gallery_urls?.[0],
    publishedAt: listing.created_at ?? undefined,
    excerpt: listing.editorial_content?.split('\n')[0]?.replace(/^#+\s*/, '') ?? listing.subtitle,
  }
}

export async function fetchPublishedDestinations(
  params: FetchDestinationsParams = {}
): Promise<FetchDestinationsResponse> {
  const { region, style, query, tags: tagsParam, sort = 'newest', page = 1, pageSize = 12 } = params
  const tagsArr = Array.isArray(tagsParam) ? tagsParam.filter((t) => (t ?? '').trim()) : []

  try {
    let q = supabase
      .from('listings')
      .select('*', { count: 'exact' })
      .eq('status', 'live')

    if (region?.trim()) {
      q = q.ilike('region', `%${region.trim()}%`)
    }
    if (style?.trim()) {
      q = q.ilike('style', `%${style.trim()}%`)
    }
    if (tagsArr.length > 0) {
      q = q.overlaps('tags', tagsArr)
    }
    if (query?.trim()) {
      const qLower = query.trim().toLowerCase()
      q = q.or(
        `title.ilike.%${qLower}%,subtitle.ilike.%${qLower}%,region.ilike.%${qLower}%,style.ilike.%${qLower}%`
      )
    }

    switch (sort) {
      case 'alphabetical':
        q = q.order('title', { ascending: true })
        break
      case 'popularity':
        q = q.order('created_at', { ascending: false })
        break
      default:
        q = q.order('created_at', { ascending: false })
    }

    const from = ((page ?? 1) - 1) * (pageSize ?? 12)
    const to = from + (pageSize ?? 12) - 1
    q = q.range(from, to)

    const { data, error, count } = await q

    if (!error && Array.isArray(data)) {
      const items = data.map(listingToDestination)
      return { data: items, total: count ?? items.length }
    }
  } catch {
    // Fallback to mock
  }

  let list = [...mockListings].filter((l) => l.status === 'live')

  if (region?.trim()) {
    list = list.filter((l) =>
      l.region?.toLowerCase().includes(region.trim().toLowerCase())
    )
  }
  if (style?.trim()) {
    list = list.filter((l) =>
      l.style?.toLowerCase().includes(style.trim().toLowerCase())
    )
  }
  if (tagsArr.length > 0) {
    list = list.filter((l) => {
      const lt = l.tags ?? []
      const ltArr = Array.isArray(lt) ? lt : []
      return tagsArr.some((t) =>
        ltArr.some((ltag) => (ltag ?? '').toLowerCase() === (t ?? '').toLowerCase())
      )
    })
  }
  if (query?.trim()) {
    const qLower = query.trim().toLowerCase()
    list = list.filter(
      (l) =>
        l.title?.toLowerCase().includes(qLower) ||
        l.subtitle?.toLowerCase().includes(qLower) ||
        l.region?.toLowerCase().includes(qLower) ||
        l.style?.toLowerCase().includes(qLower)
    )
  }

  switch (sort) {
    case 'alphabetical':
      list.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
      break
    case 'popularity':
    case 'newest':
    default:
      list.sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime()
      )
  }

  const total = list.length
  const from = ((page ?? 1) - 1) * (pageSize ?? 12)
  const paginated = list.slice(from, from + (pageSize ?? 12))
  const data = paginated.map(listingToDestination)

  return { data, total }
}

/** Search suggestions for autocomplete (titles, regions, styles) */
export async function fetchSearchSuggestions(
  query: string,
  limit = 8
): Promise<Destination[]> {
  const qTrim = (query ?? '').trim()
  if (!qTrim || qTrim.length < 2) return []

  try {
    const qLower = qTrim.toLowerCase()
    const { data, error } = await supabase
      .from('listings')
      .select('id, slug, title, region, style')
      .eq('status', 'live')
      .or(
        `title.ilike.%${qLower}%,subtitle.ilike.%${qLower}%,region.ilike.%${qLower}%,style.ilike.%${qLower}%`
      )
      .limit(limit)
      .order('created_at', { ascending: false })

    if (!error && Array.isArray(data)) {
      return data.map(listingToDestination)
    }
  } catch {
    // Fallback to mock
  }

  const list = [...mockListings].filter((l) => l.status === 'live')
  const qLower = qTrim.toLowerCase()
  const filtered = list.filter(
    (l) =>
      l.title?.toLowerCase().includes(qLower) ||
      l.subtitle?.toLowerCase().includes(qLower) ||
      l.region?.toLowerCase().includes(qLower) ||
      l.style?.toLowerCase().includes(qLower)
  )
  return filtered.slice(0, limit).map((l) => listingToDestination(l))
}

export async function fetchFeaturedEditorial(): Promise<EditorialBlock | null> {
  const blocks = mockEditorialBlocks ?? []
  return blocks.length > 0 ? (blocks[0] ?? null) : null
}

/** Fetch highlighted destinations for landing carousel (first 4–6 live listings) */
export async function fetchHighlightedDestinations(): Promise<DestinationCard[]> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('id, slug, title, subtitle, hero_image_url, gallery_urls, editorial_content')
      .eq('status', 'live')
      .order('created_at', { ascending: false })
      .limit(6)

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((l) => listingToDestinationCard(l))
    }
  } catch {
    // Fallback to mock
  }

  const list = (mockListings ?? []).filter((l) => l.status === 'live').slice(0, 6)
  return list.map((l) => listingToDestinationCard(l))
}

/** Fetch editorial teasers for landing grid */
export async function fetchEditorials(): Promise<EditorialTeaser[]> {
  const teasers = mockEditorialTeasers ?? []
  return Array.isArray(teasers) ? [...teasers] : []
}

/** Fetch a single destination by id or slug (for detail page) */
export async function fetchDestinationById(
  idOrSlug: string
): Promise<Destination | null> {
  if (!idOrSlug?.trim()) return null

  try {
    const { data: bySlug } = await supabase
      .from('listings')
      .select('*')
      .eq('slug', idOrSlug.trim())
      .eq('status', 'live')
      .single()

    if (bySlug) return listingToDestination(bySlug)

    const { data: byId } = await supabase
      .from('listings')
      .select('*')
      .eq('id', idOrSlug.trim())
      .eq('status', 'live')
      .single()

    if (byId) return listingToDestination(byId)
  } catch {
    // Fallback to mock
  }

  const found =
    mockListings.find((l) => l.slug === idOrSlug && l.status === 'live') ??
    mockListings.find((l) => l.id === idOrSlug && l.status === 'live')
  return found ? listingToDestination(found) : null
}

/** Fetch related destinations (same region/style, excluding current) */
export async function fetchRelatedDestinations(
  excludeId: string,
  limit = 4
): Promise<Destination[]> {
  try {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'live')
      .neq('id', excludeId)
      .limit(limit + 5)

    const list = Array.isArray(data) ? data : []
    const items = list.slice(0, limit).map((l) => listingToDestination(l))
    return items
  } catch {
    // Fallback to mock
  }

  const list = mockListings
    .filter((l) => l.status === 'live' && l.id !== excludeId)
    .slice(0, limit)
  return list.map((l) => listingToDestination(l))
}
