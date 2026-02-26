import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEmailTemplate } from '@/hooks/use-email-templates'
import { useSendEmail } from '@/hooks/use-email-jobs'
import { renderTemplate } from '@/api/email-templates'
import { toast } from 'sonner'
import { Send, Loader2 } from 'lucide-react'

const SAMPLE_PAYLOADS: Record<string, Record<string, string>> = {
  signup_verification: { guestName: 'Jane Doe', verificationLink: 'https://example.com/verify?token=abc' },
  inquiry_confirmation: { guestName: 'John Smith', reference: 'RR-12345', inquiryId: 'uuid-here' },
  concierge_message: { guestName: 'Alex', agentNotes: 'Your reservation is confirmed for March 15–20.' },
  payment_link: { guestName: 'Maria', paymentLink: 'https://checkout.stripe.com/xxx' },
  receipt_email: { guestName: 'Tom', amount: '1,250.00', currency: 'USD', receiptId: 'RCP-789' },
  support_acknowledgment: { guestName: 'Sarah', reference: 'RR-CI-ABC123', category: 'general' },
}

export interface AdminEmailTemplatePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string | null
}

export function AdminEmailTemplatePreview({
  open,
  onOpenChange,
  templateId,
}: AdminEmailTemplatePreviewProps) {
  const { data: template } = useEmailTemplate(templateId)
  const sendTestMutation = useSendEmail()
  const [payload, setPayload] = useState<Record<string, string>>({})
  const [testEmail, setTestEmail] = useState('')

  useEffect(() => {
    if (!template) return
    const sample = SAMPLE_PAYLOADS[template.slug] ?? SAMPLE_PAYLOADS[template.name] ?? {}
    const schema = template.substitutions_schema
    const defaults: Record<string, string> = {}
    if (schema && typeof schema === 'object') {
      const keys = Array.isArray(schema)
        ? (schema as { key?: string }[]).map((s) => s.key).filter(Boolean) as string[]
        : Object.keys(schema)
      for (const key of keys) {
        defaults[key] = (sample as Record<string, string>)[key] ?? `{{${key}}}`
      }
    }
    const next = Object.keys(defaults).length > 0 ? defaults : sample
    queueMicrotask(() => setPayload(next))
  }, [template])

  const preview = useMemo(() => {
    if (!template) return null
    const { subject, htmlBody } = renderTemplate(
      template.subject,
      template.html_body,
      template.text_body,
      payload
    )
    return { subject, html_body: htmlBody }
  }, [template, payload])

  const handleSendTest = async () => {
    if (!template || !testEmail.trim()) {
      toast.error('Enter an email address')
      return
    }
    try {
      await sendTestMutation.mutateAsync({
        templateName: template.name,
        templateSlug: template.slug ?? template.name,
        to: testEmail.trim(),
        payload,
      })
      toast.success('Test email sent')
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Failed to send')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview: {template?.name ?? 'Template'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-medium">Substitution values</h3>
            {template && (
              <div className="space-y-2">
                {Object.entries(payload).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Label className="w-32 shrink-0 text-sm">{key}</Label>
                    <Input
                      value={value}
                      onChange={(e) =>
                        setPayload((p) => ({ ...p, [key]: e.target.value }))
                      }
                      className="focus:ring-accent/30"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="border-t pt-4">
              <Label className="text-sm">Send test to</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="focus:ring-accent/30"
                />
                <Button
                  type="button"
                  onClick={handleSendTest}
                  disabled={sendTestMutation.isPending}
                  className="bg-accent hover:bg-accent/90 shrink-0"
                >
                  {sendTestMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Rendered preview</h3>
            {preview && template ? (
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Subject:</strong> {preview.subject}
                </p>
                <div
                  className="prose prose-sm max-w-none rounded bg-muted/30 p-4 overflow-auto max-h-64"
                  dangerouslySetInnerHTML={{ __html: preview.html_body || '' }}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click Preview to render with the substitution values.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
