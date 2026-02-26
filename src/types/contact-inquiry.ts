/** Contact / Support inquiry types */

export type ContactInquiryStatus =
  | 'New'
  | 'Contacted'
  | 'In Progress'
  | 'Deposit Paid'
  | 'Confirmed'
  | 'Closed'

export type ContactInquirySubject =
  | 'General Question'
  | 'Concierge Request'
  | 'Payment Inquiry'
  | 'Booking & Availability'
  | 'Cancellation or Changes'
  | 'Technical Support'
  | 'Feedback'
  | 'Other'

export interface ContactInquiry {
  id: string
  user_id: string | null
  name: string
  email: string
  subject: string
  message: string
  destination_id: string | null
  start_date: string | null
  end_date: string | null
  guests: number | null
  inquiry_reference: string | null
  is_concierge: boolean
  preferred_contact_method: string | null
  status: ContactInquiryStatus
  internal_notes: string | null
  created_at: string
  updated_at: string
}

export interface ContactInquiryCreatePayload {
  name: string
  email: string
  subject: string
  message: string
  destinationId?: string
  startDate?: string
  endDate?: string
  guests?: number
  inquiryReference?: string
  isConcierge?: boolean
  preferredContactMethod?: string
  userId?: string
}

export interface ContactInquiryCreateResponse {
  ok: boolean
  id?: string
  reference?: string
  status?: string
  createdAt?: string
  message?: string
}
