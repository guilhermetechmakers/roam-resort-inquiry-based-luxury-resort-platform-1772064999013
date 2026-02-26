import { z } from 'zod'

export const listingFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120),
  slug: z
    .string()
    .optional()
    .refine((v) => !v || v.length === 0 || /^[a-z0-9-]+$/.test(v), 'Slug must be lowercase letters, numbers, and hyphens'),
  subtitle: z.string().max(200).optional(),
  region: z.string().min(1, 'Region is required'),
  style: z.string().min(1, 'Style is required'),
  narrative: z.string().min(50, 'Narrative must be at least 50 characters'),
  experienceDetails: z.object({
    datesSuggestion: z.array(z.string()).default(['']),
    guestCapacity: z.number().min(1).default(4),
    amenities: z.array(z.string()).default([]),
    sampleItineraries: z.array(z.string()).default([]),
  }).optional(),
  galleryUrls: z.array(z.string()).default([]),
  status: z.enum(['draft', 'live']),
})

export type ListingFormValues = z.infer<typeof listingFormSchema>

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateListingForPublish(values: Partial<ListingFormValues>): ValidationResult {
  const errors: string[] = []

  if (!values.title?.trim()) errors.push('Title is required')
  else if (values.title.length < 3) errors.push('Title must be at least 3 characters')

  if (!values.region?.trim()) errors.push('Region is required')
  if (!values.style?.trim()) errors.push('Style is required')

  if (!values.narrative?.trim()) errors.push('Narrative is required')
  else if (values.narrative.length < 100) errors.push('Narrative must be at least 100 characters')

  const gallery = values.galleryUrls ?? []
  if (gallery.length < 1) errors.push('At least one gallery image is required for publishing')

  const exp = values.experienceDetails
  if (exp) {
    const dates = exp.datesSuggestion ?? []
    if (dates.length < 1 || (dates.length === 1 && !dates[0]?.trim())) {
      errors.push('At least one date suggestion is required')
    }
    if ((exp.guestCapacity ?? 0) < 1) errors.push('Guest capacity must be at least 1')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
