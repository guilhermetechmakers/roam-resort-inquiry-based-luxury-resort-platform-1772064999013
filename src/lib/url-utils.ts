/**
 * URL utilities for parsing query params and hash fragments.
 * Provides safe defaults and null-safe extraction per runtime safety rules.
 */

/**
 * Parse a query parameter from the current URL or a provided search string.
 * Returns the value or empty string if not found.
 */
export function parseQueryParam(
  name: string,
  search: string = typeof window !== 'undefined' ? window.location.search : ''
): string {
  if (!name || typeof name !== 'string') return ''
  try {
    const params = new URLSearchParams(search ?? '')
    const value = params.get(name)
    return typeof value === 'string' ? value : ''
  } catch {
    return ''
  }
}

/**
 * Parse hash fragment params (e.g. #access_token=...&type=signup).
 * Used for Supabase Auth redirect flows.
 */
export function parseHashParams(
  hash: string = typeof window !== 'undefined' ? (window.location.hash ?? '') : ''
): Record<string, string> {
  if (!hash || typeof hash !== 'string') return {}
  const trimmed = hash.startsWith('#') ? hash.slice(1) : hash
  if (!trimmed) return {}
  try {
    const params = new URLSearchParams(trimmed)
    const result: Record<string, string> = {}
    params.forEach((value, key) => {
      result[key] = value
    })
    return result
  } catch {
    return {}
  }
}

/**
 * Check if URL has Supabase-style verification hash (access_token + type=signup).
 */
export function hasVerificationHash(): boolean {
  if (typeof window === 'undefined') return false
  const params = parseHashParams(window.location.hash ?? '')
  return !!(params.access_token && (params.type === 'signup' || params.type === 'email'))
}

/**
 * Check if URL has a token in query params (token, verification_token, or token_hash).
 */
export function hasVerificationToken(search?: string): boolean {
  const s = search ?? (typeof window !== 'undefined' ? window.location.search : '')
  const token =
    parseQueryParam('token', s) ||
    parseQueryParam('verification_token', s) ||
    parseQueryParam('token_hash', s)
  return typeof token === 'string' && token.length > 0
}
