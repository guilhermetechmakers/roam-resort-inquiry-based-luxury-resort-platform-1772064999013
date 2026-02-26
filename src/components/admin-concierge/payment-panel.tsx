import { useState } from 'react'
import { Loader2, Copy, Check, CreditCard, Plus, Trash2, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { AdminInquiryPayment, StripeLinkPayload } from '@/types/admin'

interface LineItem {
  name: string
  quantity: number
  unitPrice: number
  description?: string
}

export interface MarkReceivedOptions {
  notes?: string
  reconciliationStatus?: 'pending' | 'paid' | 'confirmed' | 'reconciled'
}

export interface PaymentPanelProps {
  payments: AdminInquiryPayment[]
  onCreateStripeLink: (payload: StripeLinkPayload) => Promise<{ paymentLinkUrl: string; paymentId: string }>
  onMarkReceived?: (paymentId: string, options?: MarkReceivedOptions) => Promise<void>
  isLoading?: boolean
  className?: string
}

const DEFAULT_LINE_ITEM: LineItem = {
  name: 'Deposit',
  quantity: 1,
  unitPrice: 0,
  description: '',
}

const CURRENCIES = [
  { value: 'usd', label: 'USD' },
  { value: 'eur', label: 'EUR' },
  { value: 'gbp', label: 'GBP' },
  { value: 'cad', label: 'CAD' },
  { value: 'aud', label: 'AUD' },
] as const

const EXPIRATION_OPTIONS = [
  { value: '0', label: 'No expiration' },
  { value: '1', label: '1 day' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
] as const

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
  const [currency, setCurrency] = useState<string>('usd')
  const [useCheckoutSession, setUseCheckoutSession] = useState(false)
  const [expiresInDays, setExpiresInDays] = useState<number>(0)
  const [isCreating, setIsCreating] = useState(false)
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [markReceivedOpen, setMarkReceivedOpen] = useState(false)
  const [markReceivedPaymentId, setMarkReceivedPaymentId] = useState<string | null>(null)
  const [markReceivedNotes, setMarkReceivedNotes] = useState('')
  const [markReceivedStatus, setMarkReceivedStatus] = useState<string>('paid')
  const [isMarking, setIsMarking] = useState(false)

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

  const validItems = (items ?? []).filter(
    (i) => i.name.trim() && (i.quantity ?? 0) > 0 && (i.unitPrice ?? 0) >= 0
  )
  const totalFromItems = validItems.reduce(
    (sum, i) => sum + (i.quantity ?? 0) * (i.unitPrice ?? 0),
    0
  )
  const numAmount = parseFloat(amount) || 0
  const finalAmount = numAmount > 0 ? numAmount : totalFromItems
  const canCreate = finalAmount > 0

  const handleCreate = async () => {
    if (finalAmount <= 0) return

    setIsCreating(true)
    setCreatedUrl(null)
    try {
      const payload: StripeLinkPayload = {
        amount: finalAmount,
        items: validItems.length > 0 ? validItems : [{ name: 'Deposit', quantity: 1, unitPrice: finalAmount, description: notes || undefined }] as StripeLinkPayload['items'],
        notes: notes.trim() || undefined,
        currency,
        useCheckoutSession,
        expiresInDays: expiresInDays > 0 ? expiresInDays : undefined,
      }
      const { paymentLinkUrl } = await onCreateStripeLink(payload)
      setCreatedUrl(paymentLinkUrl)
    } finally {
      setIsCreating(false)
    }
  }

  const openMarkReceived = (paymentId: string) => {
    setMarkReceivedPaymentId(paymentId)
    setMarkReceivedNotes('')
    setMarkReceivedStatus('paid')
    setMarkReceivedOpen(true)
  }

  const handleMarkReceived = async () => {
    if (!markReceivedPaymentId || !onMarkReceived) return
    setIsMarking(true)
    try {
      await onMarkReceived(markReceivedPaymentId, {
        notes: markReceivedNotes.trim() || undefined,
        reconciliationStatus: markReceivedStatus as MarkReceivedOptions['reconciliationStatus'],
      })
      setMarkReceivedOpen(false)
      setMarkReceivedPaymentId(null)
    } finally {
      setIsMarking(false)
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
                    className="bg-accent hover:bg-accent/90"
                    onClick={() => openMarkReceived(latestPayment.id)}
                  >
                    <FileCheck className="mr-1.5 h-4 w-4" />
                    Mark as received
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <Label className="text-muted-foreground">Create payment link</Label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="mt-1 bg-muted/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Expiration</Label>
              <Select value={String(expiresInDays)} onValueChange={(v) => setExpiresInDays(parseInt(v, 10) || 0)}>
                <SelectTrigger className="mt-1 bg-muted/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRATION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-3">
            <input
              type="checkbox"
              id="use-checkout-session"
              checked={useCheckoutSession}
              onChange={(e) => setUseCheckoutSession(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-accent"
            />
            <Label htmlFor="use-checkout-session" className="text-sm cursor-pointer">
              Use Checkout Session (hosted page) instead of Payment Link
            </Label>
          </div>

          <div>
            <Label className="text-xs">Amount ({currency.toUpperCase()})</Label>
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
            disabled={isCreating || !canCreate}
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

      <Dialog open={markReceivedOpen} onOpenChange={setMarkReceivedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark payment as received</DialogTitle>
            <DialogDescription>
              Add optional reconciliation notes. This will update the payment status and create a reconciliation record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-xs">Reconciliation status</Label>
              <Select value={markReceivedStatus} onValueChange={setMarkReceivedStatus}>
                <SelectTrigger className="mt-1 bg-muted/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="reconciled">Reconciled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                placeholder="e.g. Bank transfer received, reference #12345"
                rows={3}
                value={markReceivedNotes}
                onChange={(e) => setMarkReceivedNotes(e.target.value)}
                className="mt-1 resize-none bg-muted/30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkReceivedOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90"
              onClick={handleMarkReceived}
              disabled={isMarking}
            >
              {isMarking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck className="mr-2 h-4 w-4" />}
              Mark as received
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
