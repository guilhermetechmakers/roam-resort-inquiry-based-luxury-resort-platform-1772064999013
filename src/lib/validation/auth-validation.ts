import { z } from 'zod'

/** Email format validation */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return emailRegex.test(email.trim())
}

/** Password strength scoring: 0-4 (weak to strong) */
export interface PasswordStrength {
  score: number
  label: 'Weak' | 'Fair' | 'Good' | 'Strong'
  hasMinLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecial: boolean
}

export function getPasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)

  let score = 0
  if (hasMinLength) score += 1
  if (hasUppercase) score += 1
  if (hasLowercase) score += 1
  if (hasNumber) score += 1
  if (hasSpecial) score += 1

  const labels: PasswordStrength['label'][] = ['Weak', 'Fair', 'Good', 'Strong']
  const label = labels[Math.min(score, 3)] as PasswordStrength['label']

  return {
    score,
    label,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
  }
}

export function isPasswordStrongEnough(password: string): boolean {
  const s = getPasswordStrength(password)
  return s.hasMinLength && s.score >= 3
}

/** Login schema */
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
})

/** Signup schema with password strength, role, honeypot */
export const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    email: z.string().min(1, 'Email is required').email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .refine(isPasswordStrongEnough, {
        message:
          'Password needs uppercase, lowercase, number, and special character',
      }),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['guest', 'host', 'concierge']).optional().default('guest'),
    website: z.string().max(0).optional(), // honeypot - must be empty
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => !data.website || data.website.length === 0, {
    message: 'Invalid submission',
    path: ['website'],
  })

/** Password reset request schema */
export const requestResetSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
})

/** Password reset (with token) schema */
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .refine(isPasswordStrongEnough, {
        message:
          'Password needs uppercase, lowercase, number, and special character',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type RequestResetFormData = z.infer<typeof requestResetSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
