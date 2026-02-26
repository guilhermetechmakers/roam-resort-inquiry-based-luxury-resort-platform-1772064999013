# Privacy & Legal Compliance Tools

GDPR/CCPA-aligned data handling for Roam Resort.

## Overview

- **Data Export**: User-initiated export with scope selection (profile, inquiries, payments, communications)
- **Account Deletion**: User-initiated deletion with admin review, soft-delete, and retention window
- **Admin Workflow**: Concierge reviews requests, approves/rejects, confirms exports, schedules deletions
- **Audit Trail**: All privacy actions logged in `audit_logs` table
- **Preferences**: Notification and privacy controls (data sharing opt-out, ad personalization opt-out)

## Database Schema

### Tables

- **privacy_requests**: User requests (export/delete), status, scope, admin notes
- **export_bundles**: Secure token-based download links for export packages
- **deletion_schedules**: Soft-delete scheduling with retention window
- **user_preferences**: notify_email, notify_push, data_sharing_opt_out, ad_personalization_opt_out
- **audit_logs**: Privacy events (resource='privacy_request')

### Migration

```bash
supabase migration up
```

Or apply `supabase/migrations/20250226270000_privacy_compliance_full.sql` manually.

## Edge Functions

| Function | Purpose |
|----------|---------|
| `privacy-export` | Create export request (user) |
| `privacy-delete` | Create deletion request (user) |
| `privacy-requests` | List user's requests (user) |
| `privacy-admin-requests` | List all requests (concierge) |
| `privacy-admin-action` | Approve, reject, confirm-export, schedule-delete (concierge) |
| `privacy-audit-logs` | Fetch privacy audit logs (concierge) |
| `export-bundle` | Token-based bundle retrieval |

## User Flows

1. **Settings** (`/settings`): User manages notification preferences, privacy toggles, requests data export or account deletion
2. **Admin** (`/admin/privacy-requests`): Concierge reviews pending requests, approves/rejects, confirms exports, schedules deletions
3. **Audit Logs**: Filter by action type, user, date range

## Data Retention

- Export bundles: 7-day expiry
- Deletion: Configurable retention window (default 30 days) before soft-delete → physical delete

## Security

- All endpoints require authentication
- Admin endpoints require concierge role
- RLS policies enforce user-scoped vs admin access
- Audit logs capture actor, target, and outcome
