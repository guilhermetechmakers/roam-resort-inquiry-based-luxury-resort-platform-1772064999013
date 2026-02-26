export interface FAQItem {
  id: string
  question: string
  answer: string
}

export interface ContactPayload {
  name: string
  email: string
  topic?: string
  message: string
}

export interface ContactResponse {
  ok: boolean
  ticketId?: string
  message?: string
}

export interface LegalLink {
  label: string
  href: string
}
