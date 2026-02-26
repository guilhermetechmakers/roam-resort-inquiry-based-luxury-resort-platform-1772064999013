import { z } from 'zod'

export const GALLERY_MIN = 3
export const GALLERY_MAX = 20
export const TITLE_MIN = 5
export const TITLE_MAX = 100
export const EDITORIAL_MIN_WORDS = 150
export const META_TITLE_MAX = 60
export const META_DESC_MAX = 160

export const galleryItemSchema = z.object({
  id: z.string(),
  imageUrl: z.string().url(),
  caption: z.string().max(300).optional().default(''),
  altText: z.string().min(1, 'Alt text is required for accessibility'),
  sortOrder: z.number(),
})

export const basicInfoSchema = z.object({
  title: z.string().min(TITLE_MIN, `Title must be ${TITLE_MIN}-${TITLE_MAX} characters`).max(TITLE_MAX),
  tagline: z.string().max(200).optional().default(''),
  category: z.string().min(1, 'Category is required'),
  locationCity: z.string().min(1, 'City is required'),
  locationCountry: z.string().min(1, 'Country is required'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be URL-safe (lowercase, hyphens only)').optional().default(''),
})

export const editorialSchema = z.object({
  editorialContent: z.string().min(1, 'Editorial content is required'),
})

export const experienceSchema = z.object({
  capacity: z.number().min(1).max(50),
  bedrooms: z.number().min(0).max(50),
  beds: z.number().min(0).max(50),
  bathrooms: z.number().min(0).max(50),
  amenities: z.array(z.string()).optional().default([]),
  accessibility: z.string().optional().default(''),
  activities: z.array(z.string()).optional().default([]),
  checkIn: z.string().optional().default(''),
  checkOut: z.string().optional().default(''),
})

export const seoSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be URL-safe'),
  metaTitle: z.string().min(1, 'Meta title is required').max(META_TITLE_MAX),
  metaDescription: z.string().min(1, 'Meta description is required').max(META_DESC_MAX),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  robots: z.string().optional().default('index, follow'),
})

export type BasicInfoValues = z.infer<typeof basicInfoSchema>
export type EditorialValues = z.infer<typeof editorialSchema>
export type ExperienceValues = z.infer<typeof experienceSchema>
export type SEOValues = z.infer<typeof seoSchema>

export function validateEditorialWordCount(content: string): { valid: boolean; count: number; min: number } {
  const words = (content ?? '').trim().split(/\s+/).filter(Boolean)
  const count = words.length
  return { valid: count >= EDITORIAL_MIN_WORDS, count, min: EDITORIAL_MIN_WORDS }
}

export function validateGalleryForPublish(gallery: { altText?: string }[]): { valid: boolean; errors: string[] } {
  const items = Array.isArray(gallery) ? gallery : []
  const errors: string[] = []

  if (items.length < GALLERY_MIN) {
    errors.push(`At least ${GALLERY_MIN} images required for publishing`)
  }
  if (items.length > GALLERY_MAX) {
    errors.push(`Maximum ${GALLERY_MAX} images allowed`)
  }

  const missingAlt = items.filter((i) => !(i.altText ?? '').trim())
  if (missingAlt.length > 0) {
    errors.push('All images must have alt text for accessibility')
  }

  return { valid: errors.length === 0, errors }
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  fieldErrors: Record<string, string>
}

export function validateListingForPublish(data: {
  title?: string
  tagline?: string
  category?: string
  locationCity?: string
  locationCountry?: string
  editorialContent?: string
  gallery?: { altText?: string }[]
  metaTitle?: string
  metaDescription?: string
}): ValidationResult {
  const errors: string[] = []
  const fieldErrors: Record<string, string> = {}

  if (!(data.title ?? '').trim()) {
    errors.push('Title is required')
    fieldErrors.title = 'Title is required'
  } else if ((data.title?.length ?? 0) < TITLE_MIN || (data.title?.length ?? 0) > TITLE_MAX) {
    errors.push(`Title must be ${TITLE_MIN}-${TITLE_MAX} characters`)
    fieldErrors.title = `Title must be ${TITLE_MIN}-${TITLE_MAX} characters`
  }

  if (!(data.category ?? '').trim()) {
    errors.push('Category is required')
    fieldErrors.category = 'Category is required'
  }

  if (!(data.locationCity ?? '').trim()) {
    errors.push('City is required')
    fieldErrors.locationCity = 'City is required'
  }

  if (!(data.locationCountry ?? '').trim()) {
    errors.push('Country is required')
    fieldErrors.locationCountry = 'Country is required'
  }

  const wordCheck = validateEditorialWordCount(data.editorialContent ?? '')
  if (!wordCheck.valid) {
    errors.push(`Editorial content must be at least ${wordCheck.min} words (currently ${wordCheck.count})`)
    fieldErrors.editorialContent = `Editorial content must be at least ${wordCheck.min} words`
  }

  const galleryCheck = validateGalleryForPublish(data.gallery ?? [])
  const galleryErrors = galleryCheck.errors
  galleryErrors.forEach((e) => errors.push(e))
  if (galleryErrors.length > 0) {
    fieldErrors.gallery = galleryErrors[0]
  }

  if (!(data.metaTitle ?? '').trim()) {
    errors.push('Meta title is required')
    fieldErrors.metaTitle = 'Meta title is required'
  }

  if (!(data.metaDescription ?? '').trim()) {
    errors.push('Meta description is required')
    fieldErrors.metaDescription = 'Meta description is required'
  }

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors,
  }
}

/** Alias for host-listing-create-edit (uses seo object) */
export function validateHostListingForPublish(data: {
  title?: string
  tagline?: string
  category?: string
  locationCity?: string
  locationCountry?: string
  editorialContent?: string
  gallery?: { altText?: string }[]
  seo?: { metaTitle?: string; metaDescription?: string }
}): ValidationResult {
  const result = validateListingForPublish({
    ...data,
    metaTitle: data.seo?.metaTitle,
    metaDescription: data.seo?.metaDescription,
  })
  if (result.fieldErrors.metaTitle) {
    result.fieldErrors['seo.metaTitle'] = result.fieldErrors.metaTitle
  }
  if (result.fieldErrors.metaDescription) {
    result.fieldErrors['seo.metaDescription'] = result.fieldErrors.metaDescription
  }
  return result
}
