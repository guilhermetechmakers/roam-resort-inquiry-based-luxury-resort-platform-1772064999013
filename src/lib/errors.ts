/**
 * Centralized error handling for Roam Resort.
 * Standardized server/client error payloads, mapping, and retry utilities.
 */

/** Standard error payload schema - matches server response format */
export interface ApiErrorPayload {
  error: {
    code: string
    message: string
    details?: Record<string, unknown> | string[]
    status?: number
  }
}

/** Machine-readable error codes */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'

/** Parsed client-side error for display */
export interface ParsedError {
  code: ErrorCode
  message: string
  userMessage: string
  status?: number
  details?: Record<string, string[]>
  isRetryable: boolean
}

/** Check if response body matches ApiErrorPayload */
export function isApiErrorPayload(data: unknown): data is ApiErrorPayload {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  const err = obj.error
  return (
    typeof err === 'object' &&
    err !== null &&
    typeof (err as Record<string, unknown>).message === 'string'
  )
}

/** Extract error message from various error shapes */
export function extractErrorMessage(err: unknown): string {
  if (err == null) return 'An unexpected error occurred'
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  const obj = err as Record<string, unknown>
  if (typeof obj.message === 'string') return obj.message
  if (isApiErrorPayload(obj)) return obj.error.message
  if (obj.error && typeof (obj.error as Record<string, unknown>).message === 'string') {
    return (obj.error as Record<string, unknown>).message as string
  }
  return 'An unexpected error occurred'
}

/** Map server error to user-friendly message (no sensitive data) */
export function toUserMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const msg = extractErrorMessage(err)
  const lower = msg.toLowerCase()

  if (lower.includes('rate') || lower.includes('429') || (err as { status?: number })?.status === 429) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }
  if (lower.includes('email not confirmed') || lower.includes('email')) {
    return 'Please verify your email before signing in.'
  }
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
    return 'Invalid email or password.'
  }
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) {
    return 'Network error. Check your connection and try again.'
  }
  if (lower.includes('unauthorized') || lower.includes('401')) {
    return 'Session expired. Please sign in again.'
  }
  if (lower.includes('forbidden') || lower.includes('403')) {
    return 'You do not have permission to perform this action.'
  }
  if (lower.includes('not found') || lower.includes('404')) {
    return 'The requested resource was not found.'
  }

  return msg || fallback
}

/** Parse API error into structured ParsedError */
export function parseApiError(err: unknown, fallbackMessage?: string): ParsedError {
  const status = (err as { status?: number })?.status ?? (err as { response?: { status?: number } })?.response?.status
  const msg = extractErrorMessage(err)
  const userMsg = toUserMessage(err, fallbackMessage ?? 'Something went wrong. Please try again.')

  let code: ErrorCode = 'UNKNOWN'
  let isRetryable = false
  let details: Record<string, string[]> | undefined

  if (status === 400) code = 'VALIDATION_ERROR'
  else if (status === 401) code = 'UNAUTHORIZED'
  else if (status === 403) code = 'FORBIDDEN'
  else if (status === 404) code = 'NOT_FOUND'
  else if (status === 409) code = 'CONFLICT'
  else if (status === 429) {
    code = 'RATE_LIMITED'
    isRetryable = true
  } else if (status && status >= 500) {
    code = 'SERVER_ERROR'
    isRetryable = true
  } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
    code = 'NETWORK_ERROR'
    isRetryable = true
  }

  const errObj = err as Record<string, unknown>
  if (errObj?.error && typeof errObj.error === 'object') {
    const e = errObj.error as Record<string, unknown>
    if (e.details && typeof e.details === 'object' && !Array.isArray(e.details)) {
      details = e.details as Record<string, string[]>
    }
  }

  return {
    code,
    message: msg,
    userMessage: userMsg,
    status,
    details,
    isRetryable,
  }
}

/** Retry with exponential backoff for transient errors */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    baseDelayMs?: number
    maxDelayMs?: number
    isRetryable?: (err: unknown) => boolean
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 500,
    maxDelayMs = 5000,
    isRetryable: checkRetryable = (e) => parseApiError(e).isRetryable,
  } = options

  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt === maxAttempts - 1 || !checkRetryable(err)) throw err
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastError
}
