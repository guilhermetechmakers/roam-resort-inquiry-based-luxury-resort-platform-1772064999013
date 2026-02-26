import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  email: z.string().email('Invalid email'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
      toast.success('Check your email for the reset link.')
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to send reset email')
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="font-serif text-2xl font-bold">Check your email</h1>
          <p className="mt-4 text-muted-foreground">
            We've sent a password reset link to {form.getValues('email')}.
          </p>
          <Link to="/login" className="mt-8 inline-block">
            <Button>Back to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-2xl font-bold text-center">Reset Password</h1>
        <p className="mt-2 text-center text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="mt-2"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="mt-1 text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Send Reset Link
          </Button>
        </form>
        <Link to="/login" className="mt-6 block text-center text-sm text-accent hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  )
}
