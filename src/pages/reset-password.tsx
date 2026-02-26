import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter'
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '@/lib/validation/auth-validation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function ResetPasswordPage() {
  const [success, setSuccess] = useState(false)
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null)
  const navigate = useNavigate()

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasRecoverySession(!!session)
    })
  }, [])

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: data.newPassword })
      if (error) throw error
      setSuccess(true)
      toast.success('Password updated. You can now sign in.')
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to update password')
      form.setError('root', {
        message: (err as Error).message ?? 'Failed to update password',
      })
    }
  }

  if (hasRecoverySession === null) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!hasRecoverySession) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Invalid or expired link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Please request a
              new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/forgot-password">
              <Button className="w-full">Request new reset link</Button>
            </Link>
            <Link to="/login" className="mt-4 block text-center text-sm text-accent hover:underline">
              Back to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-md text-center animate-fade-in">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Password updated</CardTitle>
            <CardDescription>
              Your password has been changed. Redirecting to sign in...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-[85vh] flex flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md border-border bg-card/95 backdrop-blur-sm shadow-card animate-fade-in-up">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Set new password</CardTitle>
            <CardDescription>
              Enter your new password below. Use at least 8 characters with a mix
              of uppercase, lowercase, numbers, and symbols.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {form.formState.errors.root && (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.root.message}
                </p>
              )}
              <div>
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="mt-2"
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
                  autoComplete="new-password"
                  className="mt-2"
                  {...form.register('confirmPassword')}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-destructive">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Updating...' : 'Update password'}
              </Button>
            </form>
            <Link
              to="/login"
              className="mt-6 block text-center text-sm text-accent hover:underline"
            >
              Back to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
