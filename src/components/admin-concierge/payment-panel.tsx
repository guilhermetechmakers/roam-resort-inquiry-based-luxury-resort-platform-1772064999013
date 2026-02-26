import { useState } from 'react'
import { Loader2, Copy, Check, CreditCard, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { AdminInquiryPayment, StripeLinkPayload } from '@/types/admin'

interface LineItem {
  name: string
  quantity: number
  unitPrice: number
  description?: string
}

export interface PaymentPanelProps {
  payments: AdminInquiryPayment[]
  onCreateStripeLink: (payload: StripeLinkPayload) => Promise<{ paymentLinkUrl: string; paymentId: string }>
  onMarkReceived?: (paymentId: string) => Promise<void>
  isLoading?: boolean
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
  className,
}: PaymentPanelProps) {
  const [amount, setAmount] = useState<string>('')
  const [items, setItems] = useState<LineItem[]>([{ ...DEFAULT_LINE_ITEM }])
  const [notes, setNotes] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const safePayments = (payments ?? []).slice()
  const latestPayment = safePayments[0] ?? null

  const addItem = () => {
    setItems((prev) => [...prev, { ...DEFAULT_LINE_ITEM }])
  }

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  const handleCreate = async () => {
    const numAmount = parseFloat(amount) || 0
    const validItems = (items ?? []).filter(
      (i) => i.name.trim() && (i.quantity ?? 0) > 0 && (i.unitPrice ?? 0) >= 0
    )
    const totalFromItems = validItems.reduce(
      (sum, i) => sum + (i.quantity ?? 0) * (i.unitPrice ?? 0),
      0
    )
    const finalAmount = numAmount > 0 ? numAmount : totalFromItems

    if (finalAmount <= 0) return

    setIsCreating(true)
    setCreatedUrl(null)
    try {
      const payload: StripeLinkPayload = {
        amount: finalAmount,
        items: validItems.length > 0 ? validItems : [{ name: 'Deposit', quantity: 1, unitPrice: finalAmount, description: notes || undefined }] as StripeLinkPayload['items'],
        notes: notes.trim() || undefined,
      }
      const { paymentLinkUrl } = await onCreateStripeLink(payload)
      setCreatedUrl(paymentLinkUrl)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopy = async () => {
    if (!createdUrl) return
    await navigator.clipboard.writeText(createdUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: 'Pending',
      link_created: 'Link Created',
      paid: 'Payment Received',
      reconciled: 'Reconciled',
    }
    return map[status] ?? status
  }

  return (
    <Card className={cn('transition-all duration-300', className)}>
      <CardHeader>
        <h3 className="font-serif text-lg font-semibold">Payment</h3>
        <p className="text-sm text-muted-foreground">
          Create Stripe payment links and track status
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {latestPayment && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Current payment
            </p>
            <p className="mt-1 font-medium">
              ${(latestPayment.amount ?? 0).toLocaleString()} {latestPayment.currency}
            </p>
            <p className="text-sm text-muted-foreground">
              {getStatusLabel(latestPayment.status ?? 'pending')}
            </p>
            {latestPayment.stripeLinkUrl && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a
                    href={latestPayment.stripeLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open link
                  </a>
                </Button>
                {onMarkReceived && latestPayment.status !== 'paid' && (
                  <Button
                    size="sm"
                    onClick={() => onMarkReceived(latestPayment.id)}
                  >
                    Mark as received
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

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
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={addItem}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add
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
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value, 10) || 0)}
                    className="w-16"
                  />
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Unit price"
                    value={item.unitPrice || ''}
                    onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-24"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeItem(idx)}
                    disabled={(items ?? []).length <= 1}
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea
              placeholder="Optional notes for the payment"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 resize-none bg-muted/30"
            />
          </div>

          <Button
            className="w-full bg-accent hover:bg-accent/90"
            onClick={handleCreate}
            disabled={isCreating || (parseFloat(amount) || 0) <= 0}
          >
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            Create Stripe link
          </Button>

          {createdUrl && (
            <div className="rounded-lg border border-accent/40 bg-accent/5 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Payment link created
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  readOnly
                  value={createdUrl}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
        )}
      </CardContent>
    </Card>
  )
}
