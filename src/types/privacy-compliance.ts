/** Privacy & Legal Compliance types - GDPR/CCPA aligned */

export type PrivacyRequestType = 'export' | 'delete'

export type PrivacyRequestStatus =
  | 'Pending'
  | 'InProgress'
  | 'Completed'
  | 'Failed'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'scheduled'

export const EXPORT_SCOPE_OPTIONS = [
  { value: 'profile', label: 'Profile data' },
  { value: 'inquiries', label: 'Inquiries & bookings' },
  { value: 'payments', label: 'Payment history' },
  { value: 'communications', label: 'Communications' },
] as const

export type ExportScopeValue = (typeof EXPORT_SCOPE_OPTIONS)[number]['value']

export interface PrivacyRequest {
  id: string
  userId: string
  type: PrivacyRequestType
  status: PrivacyRequestStatus
  scope?: ExportScopeValue[]
  notes?: string | null
  adminId?: string | null
  requestedAt: string
  completedAt?: string | null
  updatedAt?: string | null
  downloadUrl?: string | null
}

export interface AuditLogEntry {
  id: string
  actorUserId?: string | null
  actionType: string
  resource?: string | null
  resourceId?: string | null
  description?: string | null
  timestamp: string
  details?: Record<string, unknown>
}

export interface UserPreferences {
  notifyEmail: boolean
  notifyPush: boolean
  dataSharingOptOut: boolean
  adPersonalizationOptOut: boolean
  privacySettings: string[]
}
