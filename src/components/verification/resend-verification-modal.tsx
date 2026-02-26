import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isValidEmail } from '@/lib/validation/auth-validation'
import { cn } from '@/lib/utils'

export interface ResendVerificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (email: string) => Promise<{ success: boolean; error?: string }>
  defaultEmail?: string
}

export function ResendVerificationModal({
  open,
  onOpenChange,
  onSubmit,
  defaultEmail = '',
}: ResendVerificationModalProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail)
      setError(null)
    }
  }, [open, defaultEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmed = email.trim()
    if (!trimmed) {
      setError('Email is required')
      return
    }
    if (!isValidEmail(trimmed)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    try {
      const result = await onSubmit(trimmed)
      if (result.success) {
        onOpenChange(false)
        setEmail('')
        setError(null)
      } else {
        setError(result.error ?? 'Failed to resend verification email')
      }
    } catch {
      setError('Failed to resend verification email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Resend verification email</DialogTitle>
          <DialogDescription>
            Enter your email address and we&apos;ll send you a new verification link.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resend-email">Email address</Label>
            <Input
              id="resend-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                'bg-secondary/50 border-input focus:ring-accent',
                error && 'border-destructive focus-visible:ring-destructive'
              )}
              disabled={isLoading}
              autoComplete="email"
              aria-invalid={!!error}
              aria-describedby={error ? 'resend-email-error' : undefined}
            />
            {error && (
              <p id="resend-email-error" className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Resend'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
