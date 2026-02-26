import { z } from 'zod'
import { EXPORT_SCOPE_OPTIONS } from '@/types/privacy-compliance'

const scopeValues = EXPORT_SCOPE_OPTIONS.map((o) => o.value) as [string, ...string[]]

export const dataExportRequestSchema = z.object({
  scope: z
    .array(z.enum(scopeValues))
    .min(1, 'Select at least one data category')
    .default(['profile', 'inquiries', 'payments', 'communications']),
  consentAcknowledged: z.literal(true, {
    errorMap: () => ({ message: 'You must acknowledge the consent statement' }),
  }),
})

export type DataExportRequestFormData = z.infer<typeof dataExportRequestSchema>

export const accountDeletionRequestSchema = z.object({
  confirmation: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm account deletion' }),
  }),
  retentionAcknowledged: z.literal(true, {
    errorMap: () => ({ message: 'You must acknowledge the retention policy' }),
  }),
  reason: z.string().max(500).optional(),
})

export type AccountDeletionRequestFormData = z.infer<typeof accountDeletionRequestSchema>
