import { useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusAlert } from '@/components/auth/status-alert'
import {
  requestResetSchema,
  type RequestResetFormData,
} from '@/lib/validation/auth-validation'
import { cn } from '@/lib/utils'

export interface RequestResetFormProps {
  onSubmit: (email: string) => Promise<void>
  isLoading?: boolean
  error?: string
  success?: boolean
  successMessage?: string
  className?: string
}

export function RequestResetForm({
  onSubmit,
  isLoading = false,
  error = '',
  success = false,
  successMessage = "We've sent a password reset link to your email. Click the link to set a new password.",
  className,
}: RequestResetFormProps) {
  const errorRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  const form = useForm<RequestResetFormData>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { email: '' },
  })

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    }
  }, [error])

  useEffect(() => {
    if (success && successRef.current) {
      successRef.current.focus()
    }
  }, [success])

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data.email)
  })

  return (
    <div className={cn('space-y-4', className)}>
      {error && (
        <div ref={errorRef} tabIndex={-1}>
          <StatusAlert type="error" message={error} />
        </div>
      )}
      {success && (
        <div ref={successRef} tabIndex={-1}>
          <StatusAlert type="success" message={successMessage} />
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="request-reset-email">Email</Label>
          <Input
            id="request-reset-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="mt-2"
            disabled={isLoading}
            aria-invalid={!!form.formState.errors.email}
            aria-describedby={
              form.formState.errors.email
                ? 'request-reset-email-error'
                : undefined
            }
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p
              id="request-reset-email-error"
              className="mt-1 text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full bg-accent hover:bg-accent/90"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>
    </div>
  )
}
