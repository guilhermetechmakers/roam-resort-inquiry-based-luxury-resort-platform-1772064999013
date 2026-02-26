import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { requestResetSchema, type RequestResetFormData } from '@/lib/validation/auth-validation'

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { requestPasswordReset } = useAuth()

  const form = useForm<RequestResetFormData>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: RequestResetFormData) => {
    try {
      await requestPasswordReset(data.email)
      setSent(true)
      toast.success('Check your email for the reset link.')
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to send reset email')
    }
  }

  if (sent) {
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
          <Card className="w-full max-w-md border-border bg-card/95 backdrop-blur-sm shadow-card animate-fade-in text-center">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Check your email</CardTitle>
              <CardDescription>
                We've sent a password reset link to {form.getValues('email')}.
                Click the link to set a new password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/login">
                <Button className="w-full">Back to Login</Button>
              </Link>
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
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md border-border bg-card/95 backdrop-blur-sm shadow-card animate-fade-in-up">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="mt-2"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="mt-1 text-sm text-destructive" role="alert">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Send Reset Link
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
