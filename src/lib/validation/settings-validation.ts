import { z } from 'zod'
import { SUPPORTED_LANGUAGES, SUPPORTED_TIMEZONES } from '@/types/settings'

const languageValues = SUPPORTED_LANGUAGES.map((l) => l.value)
const timezoneValues = SUPPORTED_TIMEZONES.map((t) => t.value)

export const accountSettingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  language: z.enum(languageValues as [string, ...string[]], {
    errorMap: () => ({ message: 'Select a valid language' }),
  }),
  timezone: z.enum(timezoneValues as [string, ...string[]], {
    errorMap: () => ({ message: 'Select a valid timezone' }),
  }),
})

export type AccountSettingsFormData = z.infer<typeof accountSettingsSchema>
