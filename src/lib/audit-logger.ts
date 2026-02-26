/** Simple client-side audit logger for auth events. Rate-limited to avoid spam. */

const RATE_LIMIT_MS = 2000
let lastLogTime = 0

type AuditAction =
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

interface AuditEntry {
  action: AuditAction
  timestamp: string
  details?: Record<string, unknown>
}

function shouldLog(): boolean {
  const now = Date.now()
  if (now - lastLogTime < RATE_LIMIT_MS) return false
  lastLogTime = now
  return true
}

/** Emit audit event (client-side; server should persist) */
export function auditLog(
  action: AuditAction,
  details?: Record<string, unknown>
): void {
  if (!shouldLog()) return

  const entry: AuditEntry = {
    action,
    timestamp: new Date().toISOString(),
    details,
  }

  // In production, send to backend; for now, console in dev only
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[Audit]', entry)
  }

  // Placeholder for future: api.post('/api/audit', entry)
}
