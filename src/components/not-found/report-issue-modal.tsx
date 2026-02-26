/**
 * ReportIssueModal - Allows users to report a broken link or issue.
 * Reusable modal with form validation. Structure supports future API wiring.
 */
import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface ReportIssueModalProps {
  /** Whether the modal is visible */
  visible: boolean
  /** Callback when modal is closed */
  onClose: () => void
  /** Callback when form is submitted with valid data */
  onSubmit?: (data: { email?: string; message: string }) => void
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ReportIssueModal({
  visible,
  onClose,
  onSubmit,
}: ReportIssueModalProps) {
  const [email, setEmail] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const resetForm = useCallback(() => {
    setEmail('')
    setMessage('')
    setEmailError(null)
    setMessageError(null)
    setSubmitted(false)
  }, [])

  useEffect(() => {
    if (!visible) {
      resetForm()
    }
  }, [visible, resetForm])

  const validate = useCallback((): boolean => {
    let valid = true
    const msg = (message ?? '').trim()
    const em = (email ?? '').trim()

    if (msg.length === 0) {
      setMessageError('Please describe the issue.')
      valid = false
    } else {
      setMessageError(null)
    }

    if (em.length > 0 && !EMAIL_REGEX.test(em)) {
      setEmailError('Please enter a valid email address.')
      valid = false
    } else {
      setEmailError(null)
    }

    return valid
  }, [email, message])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!validate()) return

      setIsSubmitting(true)
      try {
        const payload = {
          email: (email ?? '').trim() || undefined,
          message: (message ?? '').trim(),
        }
        if (onSubmit) {
          onSubmit(payload)
        }
        toast.success('Thank you for your report. We\'ll look into it shortly.')
        setSubmitted(true)
        setTimeout(() => {
          onClose()
        }, 1500)
      } finally {
        setIsSubmitting(false)
      }
    },
    [email, message, validate, onSubmit, onClose]
  )

  return (
    <Dialog open={visible} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        showClose={true}
        className="sm:max-w-md"
        aria-describedby="report-issue-description"
      >
        <DialogHeader>
          <DialogTitle>Report a Broken Link</DialogTitle>
          <DialogDescription id="report-issue-description">
            Help us improve by reporting the page or link that didn&apos;t work.
            We&apos;ll look into it as soon as possible.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div
            className="py-8 text-center text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <p className="font-medium text-foreground">Thank you for your report.</p>
            <p className="mt-2 text-sm">
              We appreciate you taking the time to help us improve.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-email">Email (optional)</Label>
              <Input
                id="report-email"
                type="email"
                value={email ?? ''}
                onChange={(e) => setEmail(e.target.value ?? '')}
                placeholder="you@example.com"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'report-email-error' : undefined}
                className={cn(emailError && 'border-destructive focus-visible:ring-destructive')}
              />
              {emailError && (
                <p id="report-email-error" className="text-sm text-destructive">
                  {emailError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-message">What went wrong? (required)</Label>
              <Textarea
                id="report-message"
                value={message ?? ''}
                onChange={(e) => setMessage(e.target.value ?? '')}
                placeholder="Describe the broken link or issue..."
                rows={4}
                required
                aria-invalid={!!messageError}
                aria-describedby={messageError ? 'report-message-error' : undefined}
                className={cn(messageError && 'border-destructive focus-visible:ring-destructive')}
              />
              {messageError && (
                <p id="report-message-error" className="text-sm text-destructive">
                  {messageError}
                </p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Submit Report'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
