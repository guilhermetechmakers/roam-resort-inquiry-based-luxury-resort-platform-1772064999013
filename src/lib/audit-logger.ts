/** Client-side audit logger. Sends to Edge Function when available. Rate-limited. */

const RATE_LIMIT_MS = 2000
let lastLogTime = 0

export type AuditAction =
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'signup_attempt'
  | 'signup_success'
  | 'signup_failure'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'password_reset_failure'
  | 'logout'
  | 'inquiry_export'

function shouldLog(): boolean {
  const now = Date.now()
  if (now - lastLogTime < RATE_LIMIT_MS) return false
  lastLogTime = now
  return true
}

/** Emit audit event. Persists via Edge Function when auth available. */
export function auditLog(
  action: AuditAction,
  details?: Record<string, unknown>
): void {
  if (!shouldLog()) return

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[Audit]', action, details)
  }

  const url = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audit-log`
    : ''
  if (!url) return

  import('@/lib/supabase').then(({ supabase }) => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`
      }
      fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action_type: action,
          success: !action.includes('failure'),
          details: details ?? {},
        }),
      }).catch(() => {})
    })
  }).catch(() => {})
}
