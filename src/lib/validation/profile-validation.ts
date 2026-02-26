import { z } from 'zod'

const phoneRegex = /^\+?[\d\s\-()]{10,20}$/

export const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || phoneRegex.test(v), 'Invalid phone format'),
  locale: z.string().max(10).optional(),
  contactPrefs: z
    .object({
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
      phone: z.boolean().optional(),
    })
    .optional(),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password needs at least one uppercase letter')
      .regex(/[a-z]/, 'Password needs at least one lowercase letter')
      .regex(/\d/, 'Password needs at least one number')
      .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Password needs a special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type ChangePasswordFormValues = ChangePasswordFormData
