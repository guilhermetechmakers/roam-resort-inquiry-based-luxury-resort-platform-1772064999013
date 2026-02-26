import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import type { Inquiry } from '@/types'

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-amber-100 text-amber-800',
    deposit_paid: 'bg-emerald-100 text-emerald-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }
  return map[status] ?? 'bg-muted text-muted-foreground'
}

export interface AdminInquiryDetailDrawerProps {
  inquiry: Inquiry | null
  open: boolean
  onClose: () => void
  className?: string
}

export function AdminInquiryDetailDrawer({
  inquiry,
  open,
  onClose,
  className,
}: AdminInquiryDetailDrawerProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!inquiry) return null

  const listing = typeof inquiry.listing === 'object' ? inquiry.listing : null
  const title = listing?.title ?? 'Destination'
  const statusClass = getStatusBadgeClass(inquiry.status ?? '')

  return (
    <>
      <div
        role="presentation"
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label={`Inquiry details: ${inquiry.reference ?? inquiry.id}`}
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-border bg-card shadow-xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <h2 className="font-serif text-lg font-semibold">
            {inquiry.reference ?? inquiry.id}
          </h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9">
              <Link to={`/admin/inquiries/${inquiry.id}`} aria-label="Open full details">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onClose}
              aria-label="Close drawer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-6 p-6">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <span
                className={cn(
                  'inline-block rounded-full px-2 py-1 text-xs font-medium',
                  statusClass
                )}
              >
                {(inquiry.status ?? '').replace('_', ' ')}
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Listing</p>
                <p className="font-medium">{title}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dates</p>
                <p>
                  {inquiry.check_in ? formatDate(inquiry.check_in) : '—'} –{' '}
                  {inquiry.check_out ? formatDate(inquiry.check_out) : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Guests</p>
                <p>{inquiry.guests_count ?? 0}</p>
              </div>
            </CardContent>
          </Card>
          <Button asChild className="w-full">
            <Link to={`/admin/inquiries/${inquiry.id}`}>View full details</Link>
          </Button>
        </div>
      </aside>
    </>
  )
}
