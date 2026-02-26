/**
 * PaymentPanel - StripeLinkCreator + PaymentStatePanel.
 * Create Stripe payment link; mark payment received; reconcile.
 * All arrays guarded: (items ?? []); numbers default to 0.
 */

import { useState } from 'react'
import { Loader2, Copy, Check, CreditCard, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { AdminPayment, StripeLinkPayload } from '@/types/admin'

export interface LineItem {
  name: string
  quantity: number
  unitPrice: number
  description?: string
}

export interface PaymentPanelProps {
  payments: AdminPayment[] | null | undefined
  onCreateStripeLink: (payload: StripeLinkPayload) => Promise<{ paymentLinkUrl: string } | null>
  onMarkReceived?: (paymentId: string) => Promise<void>
  isLoading?: boolean
  isCreating?: boolean
  className?: string
}

const DEFAULT_LINE_ITEM: LineItem = {
  name: 'Deposit',
  quantity: 1,
  unitPrice: 0,
  description: '',
}

export function PaymentPanel({
  payments,
  onCreateStripeLink,
  onMarkReceived,
  isLoading,
  isCreating,
  className,
}: PaymentPanelProps) {
  const [amount, setAmount] = useState<string>('')
  const [items, setItems] = useState<LineItem[]>([{ ...DEFAULT_LINE_ITEM }])
  const [notes, setNotes] = useState('')
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isMarking, setIsMarking] = useState(false)

  const safePayments = (payments ?? []).slice()
  const latestPayment = safePayments[safePayments.length - 1]
  const hasLink = !!latestPayment?.stripeLinkUrl || !!createdUrl
  const linkUrl = createdUrl ?? latestPayment?.stripeLinkUrl ?? ''
  const isPaid = latestPayment?.status === 'paid'

  const addLineItem = () => {
    setItems((prev) => [...prev, { ...DEFAULT_LINE_ITEM }])
  }

  const removeLineItem = (idx: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))
  }

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    )
  }

  const handleCreateLink = async () => {
    const numAmount = Number.parseFloat(amount) || 0
    const validItems = (items ?? []).filter((i) => i.name.trim() && i.unitPrice >= 0)
    const totalFromItems = validItems.reduce(
      (sum, i) => sum + (i.quantity ?? 0) * (i.unitPrice ?? 0),
      0
    )
    const finalAmount = numAmount > 0 ? numAmount : totalFromItems
    if (finalAmount <= 0) {
      toast.error('Enter a valid amount or line items with prices')
      return
    }
    try {
      const payload: StripeLinkPayload = {
        amount: finalAmount,
        items: validItems.length > 0 ? validItems : undefined,
        notes: notes.trim() || undefined,
      }
      const result = await onCreateStripeLink(payload)
      if (result?.paymentLinkUrl) {
        setCreatedUrl(result.paymentLinkUrl)
        toast.success('Payment link created')
      } else {
        toast.error('Could not create payment link. Ensure Stripe is configured.')
      }
    } catch {
      toast.error('Failed to create payment link')
    }
  }

  const handleCopy = async () => {
    if (!linkUrl) return
    try {
      await navigator.clipboard.writeText(linkUrl)
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy link')
    }
  }

  const handleMarkReceived = async () => {
    if (!onMarkReceived) return
    const paymentId = latestPayment?.id
    if (!paymentId) {
      toast.error('No payment to mark')
      return
    }
    setIsMarking(true)
    try {
      await onMarkReceived(paymentId)
      toast.success('Payment marked as received')
    } catch {
      toast.error('Failed to update payment status')
    } finally {
      setIsMarking(false)
    }
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-border/50">
        <h3 className="font-serif text-lg font-semibold">Payment</h3>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Payment state */}
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-accent" />
            <span className="font-medium">
              {isPaid
                ? 'Payment Received'
                : hasLink
                  ? 'Link Created'
                  : 'No payment link yet'}
            </span>
          </div>
          {hasLink && linkUrl && (
            <div className="mt-3 flex items-center gap-2">
              <Input
                readOnly
                value={linkUrl}
                className="font-mono text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
          {hasLink && !isPaid && onMarkReceived && (
            <Button
              size="sm"
              className="mt-3 bg-accent hover:bg-accent/90"
              onClick={handleMarkReceived}
              disabled={isMarking}
            >
              {isMarking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Mark as received
            </Button>
          )}
        </div>

        {/* Stripe link creator */}
        <div className="space-y-4">
          <Label className="text-muted-foreground">Create payment link</Label>
          <div>
            <Label className="text-xs">Amount (USD)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 bg-muted/30"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Line items</Label>
              <Button variant="ghost" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              {(items ?? []).map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap gap-2 rounded-lg border border-border p-2"
                >
                  <Input
                    placeholder="Name"
                    value={item.name}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                    className="flex-1 min-w-[100px]"
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Qty"
                    value={item.quantity || ''}
                    onChange={(e) =>
                      updateItem(idx, 'quantity', Number(e.target.value) || 0)
                    }
                    className="w-16"
                  />
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Unit $"
                    value={item.unitPrice || ''}
                    onChange={(e) =>
                      updateItem(idx, 'unitPrice', Number(e.target.value) || 0)
                    }
                    className="w-20"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeLineItem(idx)}
                    disabled={(items ?? []).length <= 1}
                    aria-label="Remove line item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              placeholder="Payment notes..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 resize-none bg-muted/30"
            />
          </div>
          <Button
            className="w-full bg-accent hover:bg-accent/90"
            onClick={handleCreateLink}
            disabled={isCreating || isLoading}
          >
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Create Stripe payment link
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
