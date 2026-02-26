/**
 * Safe array handling utilities for runtime safety.
 * Use (data ?? []) and Array.isArray checks per project standards.
 */

export function safeArray<T>(value: T[] | null | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : []
}

export function safeMap<T, U>(
  arr: T[] | null | undefined,
  fn: (item: T, index: number) => U
): U[] {
  const list = safeArray(arr)
  return list.map(fn)
}

export function safeSort<T>(arr: T[] | null | undefined, compareFn: (a: T, b: T) => number): T[] {
  const list = safeArray(arr)
  return [...list].sort(compareFn)
}

export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0
}

export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}
