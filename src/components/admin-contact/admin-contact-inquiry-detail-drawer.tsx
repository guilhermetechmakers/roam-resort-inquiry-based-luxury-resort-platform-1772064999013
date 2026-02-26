import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUpdateContactInquiry } from '@/hooks/use-contact-inquiries'
import { useSupportMessages, useCreateSupportMessage } from '@/hooks/use-support-messages'
import { useEmailTemplates } from '@/hooks/use-email-templates'
import { useSendEmail } from '@/hooks/use-email-jobs'
import { toast } from 'sonner'
import { Send, Loader2 } from 'lucide-react'
import type { ContactInquiry, ContactInquiryStatus } from '@/types/contact-inquiry'

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'closed', label: 'Closed' },
]

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return String(d)
  }
}

export interface AdminContactInquiryDetailDrawerProps {
  inquiry: ContactInquiry | null
  open: boolean
  onClose: () => void
}

function AdminContactInquiryDetailDrawerInner({
  inquiry,
  open,
  onClose,
}: AdminContactInquiryDetailDrawerProps) {
  const [internalNotes, setInternalNotes] = useState(inquiry?.internal_notes ?? '')
  const [status, setStatus] = useState(inquiry?.status ?? 'new')
  const [replyMessage, setReplyMessage] = useState('')
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState<string>('')
  const updateMutation = useUpdateContactInquiry()
  const { data: messages = [], refetch: refetchMessages } = useSupportMessages(inquiry?.id ?? null)
  const createMessageMutation = useCreateSupportMessage(inquiry?.id ?? null)
  const { data: templates = [] } = useEmailTemplates({ status: 'published' })
  const sendEmailMutation = useSendEmail()

  const handleSave = async () => {
    if (!inquiry) return
    try {
      await updateMutation.mutateAsync({
        id: inquiry.id,
        updates: { status, internal_notes: internalNotes || undefined },
      })
      toast.success('Inquiry updated')
      onClose()
    } catch {
      toast.error('Failed to update inquiry')
    }
  }

  const handleSendReply = async () => {
    if (!inquiry || !replyMessage.trim()) return
    try {
      await createMessageMutation.mutateAsync({
        message: replyMessage.trim(),
        sender: 'concierge',
        isInternal: false,
      })
      toast.success('Reply added')
      setReplyMessage('')
      refetchMessages()
    } catch {
      toast.error('Failed to send reply')
    }
  }

  const handleSendTemplatedEmail = async () => {
    if (!inquiry || !selectedTemplateSlug) return
    const template = (templates ?? []).find((t) => t.slug === selectedTemplateSlug)
    if (!template) return
    const payload: Record<string, string> = {
      guestName: inquiry.name ?? 'Guest',
      reference: inquiry.inquiry_reference ?? inquiry.id.slice(0, 8),
      category: 'general',
      agentNotes: replyMessage || 'Please see our previous message.',
    }
    if (template.slug === 'concierge_message') payload.agentNotes = replyMessage || 'We have updated your inquiry status.'
    try {
      await sendEmailMutation.mutateAsync({
        templateSlug: selectedTemplateSlug,
        to: inquiry.email ?? '',
        payload,
      })
      toast.success('Email sent')
      setSelectedTemplateSlug('')
      setReplyMessage('')
    } catch {
      toast.error('Failed to send email')
    }
  }

  if (!inquiry) return null

  const dest = inquiry.destination
  const destName = typeof dest === 'object' && dest ? (dest.title ?? dest.slug ?? '') : ''

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            Contact Inquiry — {inquiry.inquiry_reference ?? inquiry.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="pt-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="messages">
              Messages ({Array.isArray(messages) ? messages.length : 0})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-6 pt-4">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <p className="mt-1 font-medium">{inquiry.name ?? '—'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="mt-1">
                <a
                  href={`mailto:${inquiry.email ?? ''}`}
                  className="text-accent hover:underline"
                >
                  {inquiry.email ?? '—'}
                </a>
              </p>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Subject</Label>
            <p className="mt-1 font-medium">{inquiry.subject ?? '—'}</p>
          </div>

          <div>
            <Label className="text-muted-foreground">Message</Label>
            <p className="mt-1 whitespace-pre-wrap rounded-lg border border-border bg-muted/20 p-4 text-sm">
              {inquiry.message ?? '—'}
            </p>
          </div>

          {inquiry.is_concierge && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-muted-foreground">Destination</Label>
                <p className="mt-1">{destName || '—'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Check-in</Label>
                <p className="mt-1">{formatDate(inquiry.start_date)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Check-out</Label>
                <p className="mt-1">{formatDate(inquiry.end_date)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Guests</Label>
                <p className="mt-1">{inquiry.guests ?? '—'}</p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="drawer-status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as ContactInquiryStatus)}
            >
              <SelectTrigger id="drawer-status" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="drawer-notes">Internal notes</Label>
            <Textarea
              id="drawer-notes"
              rows={4}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Add internal notes..."
              className="mt-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-accent hover:bg-accent/90"
            >
              {updateMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
          </TabsContent>
          <TabsContent value="messages" className="space-y-4 pt-4">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(Array.isArray(messages) ? messages : []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                (Array.isArray(messages) ? messages : []).map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg p-3 ${
                      m.sender === 'concierge'
                        ? 'ml-8 bg-accent/10 border border-accent/20'
                        : 'mr-8 bg-muted/50'
                    }`}
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      {m.sender === 'concierge' ? 'Concierge' : 'Guest'} · {formatDate(m.created_at)}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply-msg">Reply (adds to thread)</Label>
              <Textarea
                id="reply-msg"
                rows={3}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                className="resize-none"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={handleSendReply}
                  disabled={createMessageMutation.isPending || !replyMessage.trim()}
                  className="bg-accent hover:bg-accent/90"
                >
                  {createMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="ml-1">Add reply</span>
                </Button>
                <Select value={selectedTemplateSlug} onValueChange={setSelectedTemplateSlug}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Send templated email" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(templates) ? templates : []).map((t) => (
                      <SelectItem key={t.id} value={t.slug}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplateSlug && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSendTemplatedEmail}
                    disabled={sendEmailMutation.isPending}
                  >
                    {sendEmailMutation.isPending ? 'Sending…' : 'Send email'}
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export function AdminContactInquiryDetailDrawer(props: AdminContactInquiryDetailDrawerProps) {
  return <AdminContactInquiryDetailDrawerInner key={props.inquiry?.id ?? 'closed'} {...props} />
}
