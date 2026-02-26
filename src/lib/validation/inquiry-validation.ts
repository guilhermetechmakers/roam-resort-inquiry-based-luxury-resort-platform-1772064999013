/**
 * Validation utilities for inquiry form and runtime safety.
 * All helpers guard against null/undefined and invalid values.
 */

/**
 * Validates that end date is after start date.
 */
export function isValidDateRange(start: string, end: string): boolean {
  if (!start || !end) return false
  const startDate = new Date(start)
  const endDate = new Date(end)
  return !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate > startDate
}

/**
 * Checks if date is in the past (before today).
 */
export function isPastDate(date: string): boolean {
  if (!date) return true
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d < today
}

/**
 * Validates positive integer.
 */
export function isPositiveInt(n: unknown): n is number {
  if (typeof n !== 'number') return false
  return Number.isInteger(n) && n > 0
}

/**
 * Safe array guard - returns empty array if value is null/undefined or not an array.
 */
export function isArrayGuard<T>(value: unknown): value is T[] {
  return Array.isArray(value)
}

/**
 * Safely get array from value - returns [] for null/undefined/non-array.
 */
export function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

/**
 * Max attachment size in bytes (10MB).
 */
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024

/**
 * Allowed attachment MIME types.
 */
export const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

/**
 * Room preference options.
 */
export const ROOM_PREF_OPTIONS = ['Studio', '1BR', '2BR', '3BR', '4BR+', 'Suite', 'Villa'] as const

export type RoomPref = (typeof ROOM_PREF_OPTIONS)[number]
