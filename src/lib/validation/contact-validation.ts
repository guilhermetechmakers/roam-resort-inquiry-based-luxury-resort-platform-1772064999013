/**
 * Contact form validation - centralized validators with defensive checks.
 * Guards against null/undefined and invalid values per runtime safety rules.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME_MAX = 100
const SUBJECT_MAX = 200
const MESSAGE_MIN = 10
const MESSAGE_MAX = 2000
const REFERENCE_MAX = 50
const GUESTS_MIN = 1
const GUESTS_MAX = 20

export const CONTACT_SUBJECTS = [
  { value: 'General Question', label: 'General Question' },
  { value: 'Concierge Request', label: 'Concierge Request' },
  { value: 'Payment Inquiry', label: 'Payment Inquiry' },
  { value: 'Booking & Availability', label: 'Booking & Availability' },
  { value: 'Cancellation or Changes', label: 'Cancellation or Changes' },
  { value: 'Technical Support', label: 'Technical Support' },
  { value: 'Feedback', label: 'Feedback' },
  { value: 'Other', label: 'Other' },
] as const

export const PREFERRED_CONTACT_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
] as const

/** Validates email format. Safe for null/undefined. */
export function isValidEmail(value: unknown): boolean {
  if (value == null) return false
  const s = typeof value === 'string' ? value.trim() : String(value).trim()
  return s.length > 0 && EMAIL_REGEX.test(s)
}

/** Validates required non-empty string. Safe for null/undefined. */
export function isRequired(value: unknown): boolean {
  if (value == null) return false
  const s = typeof value === 'string' ? value : String(value)
  return s.trim().length > 0
}

/** Validates string length within bounds. Safe for null/undefined. */
export function isWithinLength(
  value: unknown,
  min?: number,
  max?: number
): boolean {
  if (value == null) return min === 0 || min === undefined
  const s = typeof value === 'string' ? value : String(value)
  const len = s.length
  if (min != null && len < min) return false
  if (max != null && len > max) return false
  return true
}

/** Validates date is today or in the future. Safe for null/undefined. */
export function isFutureOrToday(date: unknown): boolean {
  if (date == null || date === '') return false
  const d = new Date(String(date))
  if (isNaN(d.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d >= today
}

/** Validates end date is after start date. Safe for null/undefined. */
export function isValidDateRange(start: unknown, end: unknown): boolean {
  if (start == null || end == null || start === '' || end === '') return false
  const startDate = new Date(String(start))
  const endDate = new Date(String(end))
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false
  return endDate > startDate
}

/** Validates guests is a positive integer in range. Safe for null/undefined. */
export function isValidGuests(value: unknown): boolean {
  if (value == null) return false
  const n = typeof value === 'number' ? value : Number(value)
  return (
    Number.isInteger(n) &&
    !isNaN(n) &&
    n >= GUESTS_MIN &&
    n <= GUESTS_MAX
  )
}

/** Validates inquiry reference format (alphanumeric, dashes). Safe for null/undefined. */
export function isValidReference(value: unknown): boolean {
  if (value == null || value === '') return true // optional
  const s = String(value).trim()
  if (s.length > REFERENCE_MAX) return false
  return /^[A-Za-z0-9\-]+$/.test(s)
}

export const contactValidation = {
  name: (v: unknown) =>
    isRequired(v) && isWithinLength(v, undefined, NAME_MAX),
  email: (v: unknown) => isValidEmail(v),
  subject: (v: unknown) => isRequired(v) && isWithinLength(v, undefined, SUBJECT_MAX),
  message: (v: unknown) =>
    isRequired(v) &&
    isWithinLength(v, MESSAGE_MIN, MESSAGE_MAX),
  dates: (start: unknown, end: unknown) =>
    isFutureOrToday(start) && isValidDateRange(start, end),
  guests: (v: unknown) => isValidGuests(v),
  reference: (v: unknown) => isValidReference(v),
}

export { NAME_MAX, MESSAGE_MIN, MESSAGE_MAX, GUESTS_MIN, GUESTS_MAX }
