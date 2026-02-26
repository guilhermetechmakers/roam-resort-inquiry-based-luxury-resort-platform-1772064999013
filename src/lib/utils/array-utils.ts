/**
 * Safe array handling utilities.
 * All operations guard against null/undefined.
 */

/** Ensure value is an array; return empty array if not */
export function ensureArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  return []
}

/** Safe map with null guard */
export function safeMap<T, U>(arr: T[] | null | undefined, fn: (item: T, i: number) => U): U[] {
  const list = arr ?? []
  return Array.isArray(list) ? list.map(fn) : []
}

/** Safe filter with null guard */
export function safeFilter<T>(arr: T[] | null | undefined, fn: (item: T, i: number) => boolean): T[] {
  const list = arr ?? []
  return Array.isArray(list) ? list.filter(fn) : []
}

/** Safe sort with null guard */
export function safeSort<T>(arr: T[] | null | undefined, compareFn?: (a: T, b: T) => number): T[] {
  const list = arr ?? []
  if (!Array.isArray(list)) return []
  return [...list].sort(compareFn)
}

/** Extract array from API response with validation */
export function extractArray<T>(response: { data?: unknown } | null | undefined): T[] {
  const data = response?.data
  return Array.isArray(data) ? (data as T[]) : []
}

/** Type guard for array */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value)
}
