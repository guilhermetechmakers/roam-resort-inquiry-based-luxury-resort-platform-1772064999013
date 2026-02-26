/**
 * Types for Host Listing Detail (Read-Only Inquiries) page.
 * Aligned with API response shapes; all arrays use null-safe defaults.
 */

export type ListingStatus = 'Draft' | 'Live'

export interface EditorialBlock {
  id: string
  title?: string
  teaser?: string
  imageUrl?: string
  link?: string
  priority?: number
}

export interface ImageItem {
  id: string
  url: string
  altText?: string
  priority?: number
}

export interface HostListingDetail {
  id: string
  host_id: string
  title: string
  status: ListingStatus
  publish_date: string | null
  cover_image_url: string | null
  editorial_content: EditorialBlock[] | string | null
  image_gallery: ImageItem[] | string[]
  last_updated: string
  visibility: ListingStatus
  /** Additional fields from Listing type */
  slug?: string
  subtitle?: string
  region?: string
  style?: string
  editorial_content_raw?: string
  gallery_urls?: string[]
}

export interface HostListingInquiry {
  id: string
  listing_id: string
  guest_name: string
  guest_email: string | null
  start_date: string
  end_date: string
  created_at: string
  message_preview: string
  reference?: string
  status?: string | null
}

export interface HostListingInquiryDetail {
  id: string
  listing_id: string
  guest_name: string
  guest_email: string | null
  start_date: string
  end_date: string
  created_at: string
  full_message: string
  reference?: string
}

/** Alias for API usage */
export type HostInquiryDetail = HostListingInquiryDetail
