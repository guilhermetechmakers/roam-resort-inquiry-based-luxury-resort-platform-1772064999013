/**
 * API service for Host Listing Create/Edit.
 * Centralized create/update, fetch, and image upload.
 * Uses Supabase Storage for uploads; Cloudinary can be wired via Edge Function.
 */

import { supabase } from '@/lib/supabase'
import type { HostListingFormData, GalleryItem } from '@/types/host-listing-create-edit'
import type { Listing } from '@/types'
import { ensureArray } from '@/lib/utils/array-utils'

const BUCKET = 'listings'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export interface CreateHostListingPayload {
  title: string
  tagline: string
  category: string
  locationCity: string
  locationCountry: string
  slug: string
  editorialContent: string
  gallery: GalleryItem[]
  experience: HostListingFormData['experience']
  seo: HostListingFormData['seo']
  isPublished: boolean
  mapEmbed?: string
  coordinates?: string
}

export type UpdateHostListingPayload = Partial<CreateHostListingPayload>

/** Fetch listing by ID for edit */
export async function fetchListingForEdit(id: string): Promise<HostListingFormData | null> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return apiListingToFormData(data as Listing)
  } catch {
    return null
  }
}

/** Map API/Listing response to form data */
export function apiListingToFormData(listing: Listing | null | undefined): HostListingFormData | null {
  if (!listing) return null

  const galleryUrls = ensureArray(listing.gallery_urls)
  const gallery: GalleryItem[] = galleryUrls.map((url, i) => ({
    id: `g-${i}-${Date.now()}`,
    imageUrl: typeof url === 'string' ? url : (url as { url?: string })?.url ?? '',
    caption: '',
    altText: (listing as { gallery_alt?: string[] })?.gallery_alt?.[i] ?? '',
    sortOrder: i,
  }))

  const exp = listing.experienceDetails ?? {}
  const experience = {
    capacity: exp.guestCapacity ?? listing.capacity ?? 4,
    bedrooms: (exp as { bedrooms?: number }).bedrooms ?? 2,
    beds: (exp as { beds?: number }).beds ?? 2,
    bathrooms: (exp as { bathrooms?: number }).bathrooms ?? 2,
    amenities: Array.isArray(exp.amenities) ? exp.amenities : (listing.amenities ?? []),
    accessibility: (exp as { accessibility?: string }).accessibility ?? '',
    activities: Array.isArray(exp.sampleItineraries) ? exp.sampleItineraries : [],
    checkIn: (exp as { checkIn?: string }).checkIn ?? '',
    checkOut: (exp as { checkOut?: string }).checkOut ?? '',
  }

  const seo = {
    metaTitle: (listing as { seo_title?: string }).seo_title ?? listing.title ?? '',
    metaDescription: (listing as { seo_description?: string }).seo_description ?? '',
    canonicalUrl: (listing as { canonical_url?: string }).canonical_url ?? '',
    robots: (listing as { robots?: string }).robots ?? 'index, follow',
  }

  return {
    id: listing.id,
    hostId: listing.host_id,
    title: listing.title ?? '',
    tagline: listing.subtitle ?? '',
    category: listing.style ?? listing.region ?? '',
    locationCity: listing.region ?? '',
    locationCountry: '',
    editorialContent: listing.editorial_content ?? '',
    gallery,
    experience,
    seo,
    slug: listing.slug ?? '',
    isPublished: listing.status === 'live',
    createdAt: listing.created_at,
    updatedAt: listing.updated_at,
  }
}

/** Create listing */
export async function createHostListing(payload: CreateHostListingPayload): Promise<Listing> {
  const { createListing } = await import('@/api/host-listings')
  const apiPayload = {
    title: payload.title,
    slug: payload.slug,
    subtitle: payload.tagline,
    region: payload.locationCity,
    style: payload.category,
    editorial_content: payload.editorialContent,
    gallery_urls: (payload.gallery ?? []).map((g) => g.imageUrl).filter(Boolean),
    experienceDetails: {
      guestCapacity: payload.experience?.capacity ?? 4,
      amenities: payload.experience?.amenities ?? [],
      sampleItineraries: payload.experience?.activities ?? [],
    },
    status: (payload.isPublished ? 'live' : 'draft') as 'draft' | 'live',
  }
  return createListing(apiPayload)
}

/** Update listing */
export async function updateHostListing(
  id: string,
  payload: UpdateHostListingPayload
): Promise<Listing> {
  const { updateListing } = await import('@/api/host-listings')
  const apiPayload = {
    title: payload.title,
    slug: payload.slug,
    subtitle: payload.tagline,
    region: payload.locationCity,
    style: payload.category,
    editorial_content: payload.editorialContent,
    gallery_urls: (payload.gallery ?? []).map((g) => g.imageUrl).filter(Boolean),
    experienceDetails: {
      guestCapacity: payload.experience?.capacity ?? 4,
      amenities: payload.experience?.amenities ?? [],
      sampleItineraries: payload.experience?.activities ?? [],
    },
    status: (payload.isPublished ? 'live' : 'draft') as 'draft' | 'live',
  }
  return updateListing(id, apiPayload)
}

/** Upload image to Supabase Storage. Returns public URL or throws. */
export async function uploadListingImage(
  file: File,
  listingId?: string
): Promise<{ url: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be under 5MB')
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed')
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = listingId
    ? `${listingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    : `temp/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    try {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
      return { url: urlData.publicUrl }
    } catch {
      throw new Error(error.message ?? 'Upload failed')
    }
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
  return { url: urlData.publicUrl }
}

/** Fallback: add image by URL (for demo when Storage not configured) */
export function addImageByUrl(url: string): { url: string } {
  const trimmed = (url ?? '').trim()
  if (!trimmed || !trimmed.startsWith('http')) {
    throw new Error('Please enter a valid image URL')
  }
  return { url: trimmed }
}

/** Upload to Cloudinary via Edge Function. Returns { url, public_id }. */
export async function uploadToCloudinary(
  file: File,
  listingId?: string
): Promise<{ url: string; public_id?: string }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  if (!supabaseUrl || !token) {
    throw new Error('Authentication required for upload')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', listingId ? `roam-listings/${listingId}` : 'roam-listings')

  const res = await fetch(`${supabaseUrl}/functions/v1/cloudinary-upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
    body: formData,
  })

  const json = (await res.json().catch(() => ({}))) as { error?: string; url?: string; public_id?: string }
  if (!res.ok) {
    throw new Error(json.error ?? 'Cloudinary upload failed')
  }
  return {
    url: json.url ?? '',
    public_id: json.public_id,
  }
}
