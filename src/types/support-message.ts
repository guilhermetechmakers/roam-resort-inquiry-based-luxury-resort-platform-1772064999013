/** Support inquiry message types */

export type SupportMessageSender = 'guest' | 'concierge'

export interface SupportInquiryMessage {
  id: string
  inquiry_id: string
  sender: SupportMessageSender
  message: string
  is_internal: boolean
  created_at: string
  created_by: string | null
}
