import { useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter'
import { StatusAlert } from '@/components/auth/status-alert'
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '@/lib/validation/auth-validation'
import { cn } from '@/lib/utils'

export interface ResetPasswordFormProps {
  onSubmit: (params: { password: string; confirmPassword: string }) => Promise<void>
  token?: string
  isLoading?: boolean
  error?: string
  className?: string
}

export function ResetPasswordForm({
  onSubmit,
  isLoading = false,
  error = '',
  className,
}: ResetPasswordFormProps) {
  const errorRef = useRef<HTMLDivElement>(null)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const password = form.watch('newPassword') ?? ''
  const confirmPassword = form.watch('confirmPassword') ?? ''
  const isValid =
    password.length >= 8 &&
    password === confirmPassword

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    }
  }, [error])

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit({
      password: data.newPassword,
      confirmPassword: data.confirmPassword,
    })
  })

  return (
    <div className={cn('space-y-4', className)}>
      {error && (
        <div ref={errorRef} tabIndex={-1}>
          <StatusAlert type="error" message={error} />
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="reset-new-password">New password</Label>
          <Input
            id="reset-new-password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            className="mt-2"
            disabled={isLoading}
            aria-invalid={!!form.formState.errors.newPassword}
            aria-describedby={
              form.formState.errors.newPassword
                ? 'reset-new-password-error'
                : undefined
            }
            {...form.register('newPassword')}
          />
          <PasswordStrengthMeter
            password={password}
            className="mt-2"
          />
          {form.formState.errors.newPassword && (
            <p
              id="reset-new-password-error"
              className="mt-1 text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {form.formState.errors.newPassword.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="reset-confirm-password">Confirm password</Label>
          <Input
            id="reset-confirm-password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            className="mt-2"
            disabled={isLoading}
            aria-invalid={!!form.formState.errors.confirmPassword}
            aria-describedby={
              form.formState.errors.confirmPassword
                ? 'reset-confirm-password-error'
                : undefined
            }
            {...form.register('confirmPassword')}
          />
          {form.formState.errors.confirmPassword && (
            <p
              id="reset-confirm-password-error"
              className="mt-1 text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full bg-accent hover:bg-accent/90"
          disabled={isLoading || !isValid}
          aria-busy={isLoading}
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </Button>
      </form>
    </div>
  )
}
