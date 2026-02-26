import { Link } from 'react-router-dom'
import { FileText, ExternalLink, CreditCard } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Inquiry } from '@/types'

export interface RecentInquiriesFeedProps {
  inquiries: Inquiry[]
  isLoading?: boolean
  maxItems?: number
  onOpenDetails?: (inquiry: Inquiry) => void
  onCreatePaymentLink?: (inquiry: Inquiry) => void
  className?: string
}

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    contacted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    deposit_paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  }
  return map[status] ?? 'bg-muted text-muted-foreground'
}

export function RecentInquiriesFeed({
  inquiries,
  isLoading,
  maxItems = 10,
  onOpenDetails,
  onCreatePaymentLink,
  className,
}: RecentInquiriesFeedProps) {
  const list = Array.isArray(inquiries) ? inquiries : []
  const items = list.slice(0, maxItems)

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)} role="status" aria-label="Loading inquiries">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <Card className={cn(className)}>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden />
          <p className="font-medium text-foreground">No inquiries yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            New inquiries will appear here as guests submit requests.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-2', className)} role="list" aria-label="Recent inquiries">
      {items.map((inquiry) => {
        const listing = typeof inquiry.listing === 'object' ? inquiry.listing : null
        const title = listing?.title ?? 'Destination'
        return (
          <div key={inquiry.id} role="listitem">
            <Link to={`/admin/inquiries/${inquiry.id}`}>
              <Card className="transition-all duration-300 hover:shadow-card-hover hover:border-accent/30 hover:scale-[1.01]">
                <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-sm text-muted-foreground">
                      {inquiry.reference ?? inquiry.id}
                    </span>
                    <p className="font-medium truncate">{title}</p>
                    <p className="text-sm text-muted-foreground">
                      {inquiry.check_in && formatDate(inquiry.check_in)} –{' '}
                      {inquiry.check_out && formatDate(inquiry.check_out)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs font-medium',
                        getStatusBadgeClass(inquiry.status ?? '')
                      )}
                    >
                      {(inquiry.status ?? '').replace('_', ' ')}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.preventDefault()
                          onOpenDetails?.(inquiry)
                        }}
                        aria-label={`Open details for ${inquiry.reference}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.preventDefault()
                          onCreatePaymentLink?.(inquiry)
                        }}
                        aria-label={`Create payment link for ${inquiry.reference}`}
                      >
                        <CreditCard className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )
      })}
    </div>
  )
}
