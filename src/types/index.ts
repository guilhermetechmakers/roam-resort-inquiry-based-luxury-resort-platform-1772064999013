export type UserRole = 'guest' | 'host' | 'concierge'

export interface User {
  id: string
  email: string
  role: UserRole
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type ListingStatus = 'draft' | 'live'

export interface Listing {
  id: string
  slug: string
  title: string
  subtitle?: string
  region?: string
  style?: string
  status: ListingStatus
  hero_image_url?: string
  gallery_urls: string[]
  editorial_content?: string
  experience_details?: string
  capacity?: number
  amenities?: string[]
  host_id: string
  host?: User
  created_at: string
  updated_at: string
}

export type InquiryStatus =
  | 'new'
  | 'contacted'
  | 'deposit_paid'
  | 'confirmed'
  | 'cancelled'

export interface Inquiry {
  id: string
  reference: string
  guest_id: string
  listing_id: string
  listing?: Listing
  guest?: User
  check_in?: string
  check_out?: string
  guests_count?: number
  message?: string
  attachments?: string[]
  status: InquiryStatus
  assigned_concierge_id?: string
  payment_link?: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  inquiry_id: string
  event_type: string
  actor_id?: string
  metadata?: Record<string, unknown>
  created_at: string
}

/** Public destination listing (published only) */
export interface Destination {
  id: string
  slug?: string
  title?: string
  tagline?: string
  region?: string
  style?: string
  imageUrl?: string
  excerpt?: string
  publishedAt?: string
  isPublished?: boolean
}

/** Editorial block for featured host story / editorial narrative */
export interface EditorialBlock {
  id: string
  title?: string
  teaser?: string
  imageUrl?: string
  link?: string
  priority?: number
}

/** Sort options for destination listings */
export type DestinationSortOption = 'popularity' | 'newest' | 'alphabetical'
