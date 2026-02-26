/** Email template and job types */

export type EmailTemplateStatus = 'draft' | 'published' | 'archived'

export interface SubstitutionSchemaItem {
  key: string
  required?: boolean
  description?: string
}

export interface EmailTemplate {
  id: string
  name: string
  slug: string
  locale: string
  version: number
  status: EmailTemplateStatus
  subject: string
  html_body: string
  text_body: string | null
  substitutions_schema: SubstitutionSchemaItem[] | Record<string, string>
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface EmailTemplateVersion {
  id: string
  template_id: string
  version: number
  subject: string
  html_body: string
  text_body: string | null
  substitutions_schema: SubstitutionSchemaItem[] | Record<string, string>
  created_at: string
  author: string | null
}

export type EmailJobStatus =
  | 'queued'
  | 'sending'
  | 'delivered'
  | 'bounced'
  | 'failed'
  | 'suppressed'

export interface EmailJob {
  id: string
  template_id: string | null
  template_slug: string | null
  payload: Record<string, unknown>
  to: string
  from: string | null
  status: EmailJobStatus
  attempts: number
  max_attempts: number
  next_attempt: string | null
  last_error: string | null
  sendgrid_message_id: string | null
  created_at: string
  updated_at: string
}


export interface EmailDeliveryEvent {
  id: string
  job_id: string
  event_type: 'delivered' | 'bounced' | 'dropped' | 'complaint' | 'deferred'
  timestamp: string
  details: Record<string, unknown>
}

export interface SuppressionEntry {
  id: string
  email: string
  reason: string | null
  source: string | null
  added_at: string
  expires_at: string | null
}

export interface SendEmailPayload {
  templateName: string
  to: string
  payload: Record<string, string>
  locale?: string
}

export interface EmailSendPayload {
  templateSlug?: string
  templateName?: string
  templateId?: string
  to: string
  payload?: Record<string, string>
  locale?: string
}
