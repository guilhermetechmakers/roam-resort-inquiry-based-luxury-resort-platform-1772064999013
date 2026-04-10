export type UserRole = 'guest' | 'host' | 'concierge' | 'admin'

export interface User {
  id: string
  email: string
  role: UserRole
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  /** Whether the user's email has been verified (Supabase email_confirmed_at) */
  is_email_verified?: boolean
}

export type ListingStatus = 'draft' | 'live'

/** Structured experience details for destination listings */
export interface ExperienceDetails {
  datesSuggestion?: string[]
  guestCapacity?: number
  amenities?: string[]
  sampleItineraries?: string[]
}

/** Host profile for destination listings */
export interface HostProfile {
  id: string
  name: string
  avatarUrl?: string
  bio?: string
  editorialNote?: string
}

/** Alias for host in listings */
export type Host = HostProfile

/** Gallery image with metadata */
export interface ListingImage {
  id: string
  url: string
  altText?: string
  priority?: number
}

export interface Listing {
  id: string
  slug: string
  title: string
  subtitle?: string
  region?: string
  style?: string
  tags?: string[]
  status: ListingStatus
  hero_image_url?: string
  gallery_urls: string[]
  editorial_content?: string
  editorialContent?: unknown
  experience_details?: string
  experienceDetails?: ExperienceDetails
  capacity?: number
  amenities?: string[]
  host_id: string
  host?: HostProfile | User
  created_at: string
  updated_at: string
  published_at?: string | null
  /** Set when listing was imported from an external source (e.g. 'escapia') */
  external_source?: string | null
  /** The external system's unit/property identifier */
  external_id?: string | null
  /** Timestamp of the last external sync for this listing */
  last_synced_at?: string | null
}

export type InquiryStatus =
  | 'new'
  | 'contacted'
  | 'in_review'
  | 'deposit_paid'
  | 'confirmed'
  | 'closed'
  | 'cancelled'

/** Contact preferences for inquiry (opt-in per channel) */
export interface ContactPreferences {
  email?: boolean
  sms?: boolean
  phone?: boolean
}

/** Attachment metadata for inquiry */
export interface Attachment {
  id: string
  inquiry_id: string
  file_url: string
  mime_type: string
  name: string
  size: number
  uploaded_at: string
}

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
  attachments?: string[] | Attachment[]
  status: InquiryStatus
  assigned_concierge_id?: string
  payment_link?: string
  created_at: string
  updated_at: string
  /** Extended inquiry fields */
  flexible_dates?: boolean
  room_prefs?: string[]
  budget_hint?: string
  contact_preferences?: ContactPreferences
  internal_notes?: string
  /** Profile/dashboard fields */
  total_amount?: number
  payment_state?: 'paid' | 'pending' | 'cancelled'
  receipt_url?: string
}

/** Allowed event types for activities */
export type ActivityEventType =
  | 'inquiry_created'
  | 'email_sent'
  | 'status_changed'
  | 'internal_note_added'
  | 'payment_link_created'
  | 'payment_received'
  | 'note_updated'

export interface Activity {
  id: string
  inquiry_id: string
  event_type: ActivityEventType | string
  actor_id?: string
  actor_name?: string
  timestamp: string
  metadata?: Record<string, unknown>
  is_internal: boolean
  created_at: string
}

/** Filters for activity timeline */
export interface ActivityFilters {
  event_type?: string[]
  date_from?: string
  date_to?: string
  actor_id?: string
  is_internal?: boolean
}

/** Public destination listing (published only) */
export interface Destination {
  id: string
  slug?: string
  title?: string
  tagline?: string
  region?: string
  style?: string
  /** Keywords/tacit tags for filtering */
  tags?: string[]
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

/** Destination card for landing page carousel */
export interface DestinationCard {
  id: string
  name: string
  slug: string
  imageUrl: string
  editorialSnippet: string
  isHighlighted?: boolean
}

/** Editorial teaser for landing page grid */
export interface EditorialTeaser {
  id: string
  title: string
  excerpt: string
  imageUrl: string
  destinationSlug?: string
}

/** Nav item for site navigation */
export interface NavItem {
  label: string
  href: string
  active?: boolean
}

/** Sort options for destination listings */
export type DestinationSortOption = 'popularity' | 'newest' | 'alphabetical'

/** User profile for dashboard (extends auth user) */
export interface UserProfile {
  id: string
  name: string
  email: string
  emailVerified: boolean
  phone?: string
  locale?: string
  contactPrefs?: ContactPreferences
  lastLogin?: string
  avatarUrl?: string
}

/** Payment/transaction state for guest inquiry history */
export type PaymentState = 'paid' | 'pending' | 'cancelled'

/** Session for session management */
export interface Session {
  id: string
  device?: string
  location?: string
  ip?: string
  lastActive: string
  expiresAt?: string
  isCurrent?: boolean
}

/** Concierge message / notification */
export interface Message {
  id: string
  channel: string
  content: string
  readAt?: string | null
  createdAt: string
  relatedInquiryId?: string | null
}

/** Inquiry lifecycle event */
export interface InquiryEvent {
  id: string
  inquiryId: string
  eventType: string
  timestamp: string
  metadata?: Record<string, unknown>
}

/** Internal note (staff/hosts only) */
export interface InternalNote {
  id: string
  inquiryId: string
  authorId: string
  authorName?: string
  content: string
  visibleTo?: ('host' | 'concierge')[]
  createdAt: string
  created_at?: string
}

/** Receipt linked to inquiry */
export interface Receipt {
  id: string
  inquiryId: string
  url: string
  createdAt: string
}
