/** Extended user profile for Roam Resort */
export interface UserProfile {
  id: string
  name: string
  email: string
  emailVerified: boolean
  phone?: string
  locale?: string
  contactPrefs?: {
    email?: boolean
    sms?: boolean
    phone?: boolean
  }
  notificationPrefs?: {
    inquiryUpdates?: boolean
    marketing?: boolean
  }
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

/** Active session for the user */
export interface UserSession {
  id: string
  device?: string
  location?: string
  ip?: string
  lastActive: string
  expiresAt?: string
  isCurrent?: boolean
}

/** Concierge/staff message to user */
export interface UserMessage {
  id: string
  userId: string
  channel: 'email' | 'in_app'
  content: string
  readAt?: string | null
  relatedInquiryId?: string | null
  createdAt: string
}

/** Internal note on an inquiry (staff/hosts only) */
export interface InternalNote {
  id: string
  inquiryId: string
  authorId: string
  authorName?: string
  content: string
  visibleTo?: ('host' | 'concierge')[]
  createdAt: string
}

/** Inquiry lifecycle event */
export interface InquiryEvent {
  id: string
  inquiryId: string
  eventType: string
  actorId?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

/** Receipt linked to an inquiry */
export interface Receipt {
  id: string
  inquiryId: string
  url: string
  createdAt: string
}

/** Payment state for guest inquiry history */
export type PaymentState = 'paid' | 'pending' | 'cancelled'
