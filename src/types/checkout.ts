/**
 * Checkout / Payment Completion types.
 * Aligns with spec: bridge page data, completion status.
 */

export interface CheckoutBridgeData {
  inquiryId: string
  reference: string
  destinationName: string
  startDate: string
  endDate: string
  guests: number
  paymentLinkUrl: string | null
  paymentState: string
}

export interface CheckoutCompleteData {
  inquiryId: string
  reference: string
  paymentState: string
  status: 'success' | 'failed' | 'cancelled' | 'pending'
  paymentLinkUrl: string | null
  stripeSessionId: string | null
}
