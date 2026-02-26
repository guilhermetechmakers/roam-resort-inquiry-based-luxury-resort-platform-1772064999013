/**
 * Privacy Policy - Type definitions
 * CMS-ready for future dynamic content injection.
 */

/** Single section of the Privacy Policy page */
export interface PolicySection {
  id: string
  title: string
  content?: string
  subsections?: PolicySubsection[]
}

/** Subsection within a policy section */
export interface PolicySubsection {
  id: string
  title: string
  content: string
}

/** Full policy content (optional CMS support) */
export interface PolicyContent {
  sections: PolicySection[]
  lastUpdated?: string
}

/** Contact info for privacy officer */
export interface PrivacyContactInfo {
  officerName?: string
  email?: string
  portalLink?: string
}

/** User privacy request */
export interface UserRequest {
  id: string
  type: 'export' | 'delete'
  userId: string
  status: 'received' | 'in_progress' | 'completed' | 'denied'
  createdAt: string
  updatedAt?: string
  notes?: string
}

/** Data export job */
export interface DataExport {
  exportId: string
  userId: string
  status: 'ready' | 'processing' | 'failed'
  downloadUrl?: string
}
