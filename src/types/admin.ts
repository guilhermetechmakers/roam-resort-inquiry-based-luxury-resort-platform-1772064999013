/**
 * Admin Dashboard (Concierge) types.
 * Aligns with spec: Inquiry, Reconciliation, Destination, InternalNote.
 */

export type InquiryStatusDisplay =
  | 'New'
  | 'Contacted'
  | 'Deposit Paid'
  | 'Confirmed'
  | 'Cancelled'

export type PaymentStatusDisplay = 'Pending' | 'Paid' | 'Refunded'

export type ReconciliationStatusDisplay = 'Unreconciled' | 'Reconciled'

export interface AdminInquiryDates {
  start: string
  end: string
}

export interface AdminInquiry {
  id: string
  guestName: string
  destinationId: string
  destinationName: string
  dates: AdminInquiryDates
  guests: number
  status: InquiryStatusDisplay
  paymentStatus: PaymentStatusDisplay
  amount: number
  currency: string
  createdAt: string
  updatedAt: string
  notes: string[]
  reference?: string
}

export interface AdminReconciliation {
  id: string
  inquiryId: string
  amount: number
  currency: string
  status: ReconciliationStatusDisplay
  reconciledAt: string
  notes: string[]
}

export interface AdminDestination {
  id: string
  name: string
  slug: string
}

export interface AdminInternalNote {
  id: string
  inquiryId: string
  note: string
  authorId: string
  authorName?: string
  createdAt: string
}

/** Admin inquiry detail - full concierge view */
export interface AdminInquiryDetail extends AdminInquiry {
  /** Raw status for API (new, contacted, etc.) */
  rawStatus?: string
  guestEmail?: string
  guestPhone?: string
  guestMessage?: string
  attachments?: AdminAttachment[]
  internalNotes?: AdminInternalNote[]
  timelineEvents?: AdminTimelineEvent[]
  payments?: AdminInquiryPayment[]
}

export interface AdminAttachment {
  id: string
  name: string
  url: string
}

export type AdminTimelineEventType = 'email' | 'status' | 'note' | 'payment'

export interface AdminTimelineEvent {
  id: string
  inquiryId: string
  type: AdminTimelineEventType
  description: string
  createdAt: string
  authorName?: string
}

export interface AdminPayment {
  id: string
  inquiryId: string
  stripeLinkUrl?: string
  amount: number
  currency: string
  status: 'pending' | 'link_created' | 'paid' | 'reconciled'
  createdAt: string
}

export interface StripeLinkPayload {
  amount: number
  items?: Array<{ name: string; quantity: number; unitPrice: number; description?: string }>
  notes?: string
}

export interface AdminDashboardMetrics {
  totalInquiries: number
  newInquiries: number
  newThisWeek: number
  overdue: number
  unresolved: number
  pendingPayments: number
  confirmed: number
  revenue: number
  avgResponseTimeHours: number
}

export interface AdminExportFilters {
  status?: string
  destination?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

export type AdminExportType = 'inquiries' | 'reconciliations'

/** Admin Inquiry Detail page types */
export type InquiryStatusValue =
  | 'new'
  | 'contacted'
  | 'in_review'
  | 'deposit_paid'
  | 'confirmed'
  | 'closed'
  | 'cancelled'

export interface AdminInquiryDetailAttachment {
  id: string
  name: string
  url: string
}

export interface AdminInquiryDetailNote {
  id: string
  inquiryId: string
  authorName: string
  text: string
  createdAt: string
}

export interface AdminInquiryPayment {
  id: string
  inquiryId: string
  stripeLinkUrl?: string
  amount: number
  currency: string
  status: 'pending' | 'link_created' | 'paid' | 'reconciled'
  createdAt: string
}

export interface StripeLinkItem {
  name: string
  quantity: number
  unitPrice: number
  description?: string
}

export interface CreateStripeLinkPayload {
  amount: number
  items: StripeLinkItem[]
  notes?: string
}
