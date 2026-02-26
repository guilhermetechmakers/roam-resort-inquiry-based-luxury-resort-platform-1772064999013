/** User profile for settings (extends base profile with preferences) */
export interface SettingsUserProfile {
  id: string
  name: string
  email: string
  language: string
  timezone: string
  avatarUrl?: string
  preferences?: {
    notifications?: {
      inquiryUpdates?: boolean
      marketing?: boolean
      reminders?: boolean
    }
  }
}

/** Privacy request types */
export type PrivacyRequestType = 'export' | 'delete' | 'access'

/** Privacy request status */
export type PrivacyRequestStatus = 'Pending' | 'InProgress' | 'Completed' | 'Failed'

/** Privacy request for GDPR/CCPA flows */
export interface PrivacyRequest {
  id: string
  type: PrivacyRequestType
  status: PrivacyRequestStatus
  createdAt: string
  updatedAt: string
  downloadUrl?: string
}

/** Session for security settings */
export interface SettingsSession {
  id: string
  device: string
  lastActive: string
  ip?: string
  isCurrent?: boolean
}

/** Export job status */
export type ExportJobStatus = 'Queued' | 'InProgress' | 'Completed' | 'Failed'

/** Export job for data export flow */
export interface ExportJob {
  id: string
  status: ExportJobStatus
  downloadUrl?: string
  createdAt: string
  completedAt?: string
}

/** Supported languages */
export const SUPPORTED_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
] as const

/** Supported timezones (common subset) */
export const SUPPORTED_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'UTC', label: 'UTC' },
] as const
