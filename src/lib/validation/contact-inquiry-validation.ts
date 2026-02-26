/**
 * Contact Inquiry Validation Library
 * Centralized validators for contact/support form.
 * Defensive checks to avoid calling array/string methods on nullish values.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REFERENCE_REGEX = /^[A-Za-z0-9\-_]+$/

export const SUBJECT_OPTIONS = [
  'General Question',
  'Concierge Request',
  'Payment Inquiry',
  'Booking & Availability',
  'Cancellation or Changes',
  'Technical Support',
  'Feedback',
  'Other',
] as const

export const PREFERRED_CONTACT_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
] as const

export function validateRequired(value: unknown, fieldName: string): string | null {
  if (value == null) return `${fieldName} is required`
  const s = String(value).trim()
  if (s.length === 0) return `${fieldName} is required`
  return null
}

export function validateEmail(value: unknown): string | null {
  if (value == null || typeof value !== 'string') return 'Valid email is required'
  const trimmed = value.trim()
  if (trimmed.length === 0) return 'Email is required'
  if (!EMAIL_REGEX.test(trimmed)) return 'Please enter a valid email address'
  if (trimmed.length > 255) return 'Email must be 255 characters or less'
  return null
}

export function validateName(value: unknown): string | null {
  const err = validateRequired(value, 'Name')
  if (err) return err
  const s = String(value ?? '').trim()
  if (s.length > 100) return 'Name must be 100 characters or less'
  return null
}

export function validateSubject(value: unknown): string | null {
  const err = validateRequired(value, 'Subject')
  if (err) return err
  const s = String(value ?? '').trim()
  if (!SUBJECT_OPTIONS.includes(s as (typeof SUBJECT_OPTIONS)[number])) {
    return 'Please select a valid subject'
  }
  return null
}

export function validateMessage(value: unknown): string | null {
  const err = validateRequired(value, 'Message')
  if (err) return err
  const s = String(value ?? '').trim()
  if (s.length < 10) return 'Message must be at least 10 characters'
  if (s.length > 5000) return 'Message must be 5000 characters or less'
  return null
}

export function validateDateRange(
  startDate: unknown,
  endDate: unknown,
  required: boolean
): string | null {
  const start = startDate != null ? String(startDate).trim() : ''
  const end = endDate != null ? String(endDate).trim() : ''
  if (!required && !start && !end) return null
  if (required && (!start || !end)) {
    return 'Check-in and check-out dates are required'
  }
  if (!start || !end) return null
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()
  const today = new Date().setHours(0, 0, 0, 0)
  if (isNaN(startTime) || isNaN(endTime)) return 'Please enter valid dates'
  if (startTime < today) return 'Check-in date must be in the future'
  if (endTime <= startTime) return 'Check-out date must be after check-in'
  return null
}

export function validateGuests(value: unknown, required: boolean): string | null {
  if (!required && (value == null || value === '')) return null
  if (required && (value == null || value === '')) return 'Number of guests is required'
  const n = Number(value)
  if (isNaN(n) || n < 1) return 'Guests must be at least 1'
  if (n > 99) return 'Guests must be 99 or less'
  return null
}

export function validateInquiryReference(value: unknown): string | null {
  if (value == null || value === '') return null
  const s = String(value).trim()
  if (s.length > 50) return 'Reference must be 50 characters or less'
  if (!REFERENCE_REGEX.test(s)) return 'Reference can only contain letters, numbers, hyphens, and underscores'
  return null
}

export function isConciergeSubject(subject: unknown): boolean {
  return subject === 'Concierge Request'
}
