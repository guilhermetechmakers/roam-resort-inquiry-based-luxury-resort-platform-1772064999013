import { supabase } from '@/lib/supabase'
import type { Listing, ExperienceDetails } from '@/types'
import { mockListings } from '@/data/mock-listings'

export interface CreateListingPayload {
  title: string
  slug: string
  subtitle?: string
  region: string
  style: string
  editorial_content?: string
  experience_details?: string
  experienceDetails?: ExperienceDetails
  gallery_urls?: string[]
  hero_image_url?: string
  capacity?: number
  amenities?: string[]
  status: 'draft' | 'live'
  host_id?: string
}

export type UpdateListingPayload = Partial<CreateListingPayload>

async function getCurrentUserId(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const id = session?.user?.id
    if (id) return id
  } catch {
    // Fallback for demo without auth
  }
  return 'host-1'
}

export async function createListing(payload: CreateListingPayload): Promise<Listing> {
  const hostId = await getCurrentUserId()

  try {
    const { data, error } = await supabase
      .from('listings')
      .insert({
        title: payload.title,
        slug: payload.slug,
        subtitle: payload.subtitle,
        region: payload.region,
        style: payload.style,
        editorial_content: payload.editorial_content,
        experience_details: payload.experience_details ?? (payload.experienceDetails ? JSON.stringify(payload.experienceDetails) : null),
        gallery_urls: payload.gallery_urls ?? [],
        hero_image_url: payload.hero_image_url ?? payload.gallery_urls?.[0],
        capacity: payload.experienceDetails?.guestCapacity ?? payload.capacity,
        amenities: payload.amenities ?? payload.experienceDetails?.amenities ?? [],
        status: payload.status ?? 'draft',
        host_id: hostId,
      })
      .select()
      .single()

    if (!error && data) return data as Listing
  } catch {
    // Fallback: return mock for demo
  }

  const mock: Listing = {
    id: `mock-${Date.now()}`,
    slug: payload.slug,
    title: payload.title,
    subtitle: payload.subtitle,
    region: payload.region,
    style: payload.style,
    status: payload.status ?? 'draft',
    hero_image_url: payload.hero_image_url ?? payload.gallery_urls?.[0],
    gallery_urls: payload.gallery_urls ?? [],
    editorial_content: payload.editorial_content,
    experience_details: payload.experience_details,
    experienceDetails: payload.experienceDetails,
    capacity: payload.experienceDetails?.guestCapacity ?? payload.capacity,
    amenities: payload.amenities ?? payload.experienceDetails?.amenities ?? [],
    host_id: hostId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  return mock
}

export async function updateListing(
  id: string,
  payload: UpdateListingPayload
): Promise<Listing> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .update({
        title: payload.title,
        slug: payload.slug,
        subtitle: payload.subtitle,
        region: payload.region,
        style: payload.style,
        editorial_content: payload.editorial_content,
        experience_details: payload.experience_details ?? (payload.experienceDetails ? JSON.stringify(payload.experienceDetails) : undefined),
        gallery_urls: payload.gallery_urls,
        hero_image_url: payload.hero_image_url ?? payload.gallery_urls?.[0],
        capacity: payload.experienceDetails?.guestCapacity ?? payload.capacity,
        amenities: payload.amenities ?? payload.experienceDetails?.amenities,
        status: payload.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (!error && data) return data as Listing
  } catch {
    // Fallback
  }

  const existing = mockListings.find((l) => l.id === id)
  if (existing) {
    return {
      ...existing,
      ...payload,
      updated_at: new Date().toISOString(),
    } as Listing
  }

  throw new Error('Listing not found')
}

export async function publishListing(id: string): Promise<Listing> {
  return updateListing(id, { status: 'live' })
}

/** Check if slug is available (unique). Returns true if available. */
export async function checkSlugUniqueness(
  slug: string,
  excludeListingId?: string
): Promise<{ available: boolean; message?: string }> {
  const s = (slug ?? '').trim().toLowerCase()
  if (!s || !/^[a-z0-9-]+$/.test(s)) {
    return { available: false, message: 'Slug must be URL-safe (lowercase, letters, numbers, hyphens)' }
  }

  try {
    let q = supabase
      .from('listings')
      .select('id')
      .eq('slug', s)
      .limit(1)

    if (excludeListingId) {
      q = q.neq('id', excludeListingId)
    }

    const { data, error } = await q

    if (error) return { available: true }
    const list = Array.isArray(data) ? data : []
    return { available: list.length === 0 }
  } catch {
    return { available: true }
  }
}

/** Autosave draft listing. Persists current state without publishing. */
export async function autosaveListing(
  id: string,
  payload: UpdateListingPayload
): Promise<{ listing: Listing; savedAt: string }> {
  const updated = await updateListing(id, {
    ...payload,
    status: 'draft',
  })
  return {
    listing: updated,
    savedAt: updated.updated_at ?? new Date().toISOString(),
  }
}
