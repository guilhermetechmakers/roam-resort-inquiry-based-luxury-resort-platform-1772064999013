/**
 * Types for Host Listing Create/Edit page.
 * All arrays use null-safe defaults; API responses should be validated.
 */

export interface GalleryItem {
  id: string
  listingId?: string
  imageUrl: string
  /** Cloudinary public_id for transformations (optional) */
  publicId?: string
  caption: string
  altText: string
  sortOrder: number
}

export interface ListingExperience {
  listingId?: string
  capacity: number
  bedrooms: number
  beds: number
  bathrooms: number
  amenities: string[]
  accessibility: string
  activities: string[]
  checkIn?: string
  checkOut?: string
}

export interface ListingMetadata {
  listingId?: string
  metaTitle: string
  metaDescription: string
  canonicalUrl: string
  robots: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
}

export interface HostListingFormData {
  id?: string
  hostId?: string
  title: string
  tagline: string
  category: string
  locationCity: string
  locationCountry: string
  mapEmbed?: string
  coordinates?: string
  editorialContent: string
  overview?: string
  narrative?: string
  highlights?: string[]
  gallery: GalleryItem[]
  experience: ListingExperience
  seo: ListingMetadata
  slug: string
  isPublished: boolean
  createdAt?: string
  updatedAt?: string
}

export const DEFAULT_EXPERIENCE: ListingExperience = {
  capacity: 4,
  bedrooms: 2,
  beds: 2,
  bathrooms: 2,
  amenities: [],
  accessibility: '',
  activities: [],
  checkIn: '',
  checkOut: '',
}

export const DEFAULT_METADATA: ListingMetadata = {
  metaTitle: '',
  metaDescription: '',
  canonicalUrl: '',
  robots: 'index, follow',
}

export const DEFAULT_FORM_DATA: Omit<HostListingFormData, 'id' | 'hostId' | 'createdAt' | 'updatedAt'> = {
  title: '',
  tagline: '',
  category: '',
  locationCity: '',
  locationCountry: '',
  editorialContent: '',
  gallery: [],
  experience: { ...DEFAULT_EXPERIENCE },
  seo: { ...DEFAULT_METADATA },
  slug: '',
  isPublished: false,
}
