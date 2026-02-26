import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter'
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '@/lib/validation/auth-validation'

export interface PasswordResetModalProps {
  show: boolean
  onClose: () => void
  token?: string
  onSuccess?: () => void
}

export function PasswordResetModal({
  show,
  onClose,
  onSuccess,
}: PasswordResetModalProps) {
  const [success, setSuccess] = useState(false)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      const { resetPassword } = await import('@/api/auth')
      await resetPassword(data.newPassword)
      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      form.setError('root', {
        message: (err as Error).message ?? 'Failed to reset password',
      })
    }
  }

  const handleClose = () => {
    form.reset()
    setSuccess(false)
    onClose()
  }

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="reset-password-description"
        aria-labelledby="reset-password-title"
      >
        <DialogHeader>
          <DialogTitle id="reset-password-title" className="font-serif text-xl">
            Set new password
          </DialogTitle>
          <DialogDescription id="reset-password-description">
            Enter your new password below. Use at least 8 characters with a mix
            of uppercase, lowercase, numbers, and symbols.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center animate-fade-in">
            <p className="text-muted-foreground">
              Your password has been updated. You can now sign in.
            </p>
            <Button className="mt-4" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 space-y-4"
          >
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <div>
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                className="mt-2"
                autoComplete="new-password"
                {...form.register('newPassword')}
              />
              <PasswordStrengthMeter
                password={form.watch('newPassword') ?? ''}
                className="mt-2"
              />
              {form.formState.errors.newPassword && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                className="mt-2"
                autoComplete="new-password"
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Updating...' : 'Update password'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
