import { z } from 'zod'

export const listingFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  subtitle: z.string().max(300).optional(),
  region: z.string().min(1, 'Region is required'),
  style: z.string().min(1, 'Style is required'),
  narrative: z.string().min(100, 'Narrative must be at least 100 characters'),
  experienceDetails: z.string().optional(),
  guestCapacity: z.coerce.number().min(1, 'At least 1 guest').max(50).optional(),
  datesSuggestion: z.string().optional(),
  amenities: z.string().optional(),
  sampleItineraries: z.string().optional(),
})

export type ListingFormValues = z.infer<typeof listingFormSchema>

export interface ListingValidationResult {
  isValid: boolean
  errors: string[]
}

const NARRATIVE_MIN = 100
const TITLE_MAX = 200
const GALLERY_MIN_FOR_PUBLISH = 1

export function validateListingForPublish(data: {
  title?: string
  region?: string
  style?: string
  narrative?: string
  galleryUrls?: string[]
}): ListingValidationResult {
  const errors: string[] = []

  if (!data.title?.trim()) errors.push('Title is required')
  if ((data.title?.length ?? 0) > TITLE_MAX)
    errors.push(`Title must be under ${TITLE_MAX} characters`)
  if (!data.region?.trim()) errors.push('Region is required')
  if (!data.style?.trim()) errors.push('Style is required')
  if (!data.narrative?.trim()) errors.push('Narrative is required')
  if ((data.narrative?.length ?? 0) < NARRATIVE_MIN)
    errors.push(`Narrative must be at least ${NARRATIVE_MIN} characters`)

  const galleryCount = Array.isArray(data.galleryUrls) ? data.galleryUrls.length : 0
  if (galleryCount < GALLERY_MIN_FOR_PUBLISH)
    errors.push(`At least ${GALLERY_MIN_FOR_PUBLISH} image is required for publishing`)

  return {
    isValid: errors.length === 0,
    errors,
  }
}
