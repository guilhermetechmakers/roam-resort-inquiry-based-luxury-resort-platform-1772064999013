# Session & Security Management

## Overview

This document describes the Session & Security Management system for Roam Resort, including database schema, Edge Functions, API layer, and frontend integration.

## Database Schema

### Migration: `20250226260000_session_security_audit.sql`

**user_sessions**
- `id` (UUID, PK)
- `user_id` (FK → auth.users)
- `device_info`, `ip_address`, `user_agent`
- `created_at`, `last_active_at`, `expires_at`, `revoked_at`
- `session_token_hash` (optional)

**audit_logs**
- `id`, `actor_user_id`, `action_type`, `resource`, `resource_id`
- `timestamp`, `ip_address`, `user_agent`, `success`, `details` (JSONB)

**rate_limit_records**
- `id`, `key`, `limit_count`, `window_start`, `count`, `breached`, `grace_period_until`

## Edge Functions

| Function | Purpose |
|----------|---------|
| `session-create` | Creates a session record after login. Called by client with auth header. |
| `session-revoke` | Revokes a single session or all sessions (`revokeAll: true`). |
| `audit-log` | Persists audit events. Accepts `action_type`, `resource`, `resource_id`, `success`, `details`. |
| `audit-export` | Returns audit logs as CSV for concierge. Supports filters: `action_type`, `date_from`, `date_to`, `limit`. |

### Deploy Edge Functions

```bash
supabase functions deploy session-create
supabase functions deploy session-revoke
supabase functions deploy audit-log
supabase functions deploy audit-export
```

## API Layer

- **`src/api/sessions.ts`**: `createSession`, `revokeSession`, `revokeAllSessions`
- **`src/api/audit-logs.ts`**: `fetchAuditLogs`, `exportAuditLogsCsv`
- **`src/api/profile.ts`**: `fetchSessions`, `terminateSession`, `getStoredSessionId`, `setStoredSessionId`

## Frontend Integration

### Session Management
- **Profile → Sessions** (`/profile/sessions`): Lists active sessions, revoke single, revoke all
- Session ID stored in `sessionStorage` when created; used to identify current device
- On login/signup, `createSession` is called and session ID is stored

### Audit Logging
- **Admin → Audit Logs** (`/admin/audit-logs`): Concierge-only. View and export CSV with filters
- Auth events (login, signup, logout, etc.) sent to `audit-log` Edge Function
- Inquiry exports log `inquiry_export` action

### Bot Protection
- **Honeypot field** on signup form: hidden `website` field; bots that fill it are rejected
- **Rate limit hints**: Login/signup show "Too many attempts. Please wait..." on 429

### Role Selection
- Signup includes role selector: Guest (requesting stays) or Host (listing properties)
- Role stored in `user_metadata` and synced to `profiles` via trigger

## Environment Variables

- `VITE_SUPABASE_URL`: Supabase project URL (used for Edge Function calls)
- `VITE_SUPABASE_ANON_KEY`: Anon key (client)

## Runtime Safety

All code follows mandatory guards:
- `(items ?? []).map(...)` for array operations
- `Array.isArray(data) ? data : []` for API responses
- `useState<Session[]>([])` and `useState<UserProfile | null>(null)` for initial state
