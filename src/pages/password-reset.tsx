import { useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { usePasswordReset } from '@/hooks/use-password-reset'
import { RequestResetForm } from '@/components/auth/request-reset-form'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { StatusAlert } from '@/components/auth/status-alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920'

export function PasswordResetPage() {
  const navigate = useNavigate()
  const successRef = useRef<HTMLDivElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  const {
    mode,
    successType,
    isLoading,
    isCheckingSession,
    error,
    userEmail,
    requestReset,
    resetPassword,
  } = usePasswordReset()

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus({ preventScroll: false })
    }
  }, [error])

  useEffect(() => {
    if (mode === 'success' && successRef.current) {
      successRef.current.focus({ preventScroll: false })
    }
  }, [mode, successType])

  const handleRequestSubmit = async (email: string) => {
    const ok = await requestReset(email)
    if (ok) {
      toast.success('Check your email for the reset link.')
    }
  }

  const handleResetSubmit = async (data: {
    password: string
    confirmPassword: string
  }) => {
    const ok = await resetPassword(data)
    if (ok) {
      toast.success('Password updated. You can now sign in.')
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="relative min-h-[85vh] flex flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md border-border bg-card/95 backdrop-blur-sm shadow-card animate-fade-in">
            <CardHeader>
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (mode === 'invalid-token') {
    return (
      <div className="relative min-h-[85vh] flex flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md border-border bg-card/95 backdrop-blur-sm shadow-card rounded-xl animate-fade-in-up">
            <CardHeader>
              <CardTitle className="font-serif text-xl">
                Invalid or expired link
              </CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired. Please
                request a new one.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/password-reset">
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  Request new reset link
                </Button>
              </Link>
              <Link
                to="/login"
                className="block text-center text-sm text-accent hover:underline"
              >
                Back to Login
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (mode === 'success') {
    const isRequestSuccess = successType === 'request'
    return (
      <div className="relative min-h-[85vh] flex flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-16">
          <Card
            ref={successRef}
            tabIndex={-1}
            className="w-full max-w-md border-border bg-card/95 backdrop-blur-sm shadow-card animate-fade-in text-center"
          >
            <CardHeader>
              <CardTitle className="font-serif text-xl">
                {isRequestSuccess ? 'Check your email' : 'Password updated'}
              </CardTitle>
              <CardDescription>
                {isRequestSuccess ? (
                  <>
                    We&apos;ve sent a password reset link to {userEmail || 'your email'}.
                    Click the link to set a new password.
                  </>
                ) : (
                  <>
                    Your password has been changed. Redirecting to sign in...
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusAlert
                type="success"
                message={
                  isRequestSuccess
                    ? 'If an account exists, you will receive a reset link shortly.'
                    : 'You can now sign in with your new password.'
                }
                id="password-reset-success"
              />
              <div className="flex flex-col gap-2">
                <Link to="/login">
                  <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    Back to Login
                  </Button>
                </Link>
                {isRequestSuccess && (
                  <Link
                    to="/password-reset"
                    className="text-sm text-accent hover:underline"
                  >
                    Didn&apos;t receive the email? Try again
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[85vh] flex flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-16">
        <Card
          className={cn(
            'w-full max-w-md border-border bg-card/95 backdrop-blur-sm shadow-card',
            'animate-fade-in-up'
          )}
        >
          <CardHeader>
            <CardTitle className="font-serif text-xl">
              {mode === 'request' ? 'Reset Password' : 'Set new password'}
            </CardTitle>
            <CardDescription>
              {mode === 'request' ? (
                "Enter your email and we'll send you a link to reset your password."
              ) : (
                'Enter your new password below. Use at least 8 characters with a mix of uppercase, lowercase, numbers, and symbols.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div ref={errorRef} tabIndex={-1}>
                <StatusAlert
                  type="error"
                  message={error}
                  id="password-reset-error"
                />
              </div>
            )}
            {mode === 'request' ? (
              <RequestResetForm
                onSubmit={handleRequestSubmit}
                isLoading={isLoading}
              />
            ) : (
              <ResetPasswordForm
                onSubmit={handleResetSubmit}
                isLoading={isLoading}
              />
            )}
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
