/**
 * Data normalization utilities for runtime safety.
 * Guards against null/undefined for array operations and API responses.
 * Per mandatory coding standards - use these patterns throughout the codebase.
 */

/** Safely get array from value - returns [] if null, undefined, or not an array */
export function ensureArray<T>(value: unknown): T[] {
  if (value == null) return []
  return Array.isArray(value) ? (value as T[]) : []
}

/** Safely map over array - (items ?? []).map(...) pattern */
export function safeMap<T, U>(
  items: T[] | null | undefined,
  fn: (item: T, index: number) => U
): U[] {
  const arr = ensureArray<T>(items)
  return arr.map(fn)
}

/** Safely get first element or default */
export function firstOrDefault<T>(
  items: T[] | null | undefined,
  defaultValue: T
): T {
  const arr = ensureArray<T>(items)
  return arr.length > 0 ? arr[0] : defaultValue
}

/** Normalize API response data - ensures array default */
export function normalizeResponseData<T>(
  response: { data?: T[] | null } | null | undefined
): T[] {
  const data = response?.data
  return data == null ? [] : Array.isArray(data) ? data : []
}

/** Destructure with defaults for API responses */
export function withDefaults<T extends Record<string, unknown>>(
  obj: T | null | undefined,
  defaults: Partial<T>
): T {
  const base = obj ?? ({} as T)
  return { ...defaults, ...base } as T
}
