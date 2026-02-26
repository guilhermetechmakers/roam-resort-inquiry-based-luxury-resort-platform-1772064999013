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
  createdAt: string
}

export interface AdminDashboardMetrics {
  newInquiries: number
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
