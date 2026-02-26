import { useState, useCallback } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const DELETE_CONFIRM_TEXT = 'delete my account'

export interface AccountDeletionRequestFormProps {
  onSubmit: (data: { reason?: string }) => Promise<void>
  isLoading?: boolean
  retentionDays?: number
  className?: string
}

export function AccountDeletionRequestForm({
  onSubmit,
  isLoading = false,
  retentionDays = 30,
  className,
}: AccountDeletionRequestFormProps) {
  const [confirmText, setConfirmText] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string>('')

  const isConfirmValid = confirmText.trim().toLowerCase() === DELETE_CONFIRM_TEXT

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')
      if (!isConfirmValid) {
        setError(`Please type "${DELETE_CONFIRM_TEXT}" to confirm`)
        return
      }
      try {
        await onSubmit({ reason: reason.trim() || undefined })
      } catch (err) {
        setError((err as Error).message ?? 'Request failed')
      }
    },
    [isConfirmValid, reason, onSubmit]
  )

  return (
    <Card className={cn('overflow-hidden transition-all duration-300 hover:shadow-card-hover border-destructive/30', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          <h3 className="font-serif text-xl font-semibold text-destructive">Delete Account</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all associated data. This action requires admin approval and a {retentionDays}-day retention window before final deletion.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" aria-label="Account deletion request form">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">Before you proceed:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>All your inquiries, preferences, and profile data will be deleted</li>
                <li>This action cannot be undone after the retention period</li>
                <li>Our team will review your request within 48 hours</li>
                <li>Data is soft-deleted for {retentionDays} days before permanent removal</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-delete" className="font-medium">
              Type <strong className="text-destructive">{DELETE_CONFIRM_TEXT}</strong> to confirm
            </Label>
            <Input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={DELETE_CONFIRM_TEXT}
              className="border-destructive/30 focus-visible:ring-destructive/50"
              aria-describedby="confirm-desc"
              autoComplete="off"
            />
            <p id="confirm-desc" className="text-xs text-muted-foreground">
              This confirms you understand the consequences of account deletion.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="font-medium">
              Reason (optional)
            </Label>
            <Input
              id="reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Help us improve by sharing why you're leaving"
              maxLength={500}
              aria-describedby="reason-desc"
            />
            <p id="reason-desc" className="text-xs text-muted-foreground">
              {reason.length}/500 characters
            </p>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="destructive"
            disabled={isLoading || !isConfirmValid}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isLoading ? 'Submitting...' : 'Request account deletion'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
