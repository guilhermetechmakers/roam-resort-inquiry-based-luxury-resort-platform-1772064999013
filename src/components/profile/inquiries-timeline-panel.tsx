import { useState, useMemo } from 'react'
import { FileText, ExternalLink, ChevronRight, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import type { Inquiry, InquiryStatus } from '@/types'
import { cn } from '@/lib/utils'

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  deposit_paid: 'Deposit Paid',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  contacted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  deposit_paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
}

export interface InquiriesTimelinePanelProps {
  inquiries: Inquiry[]
  isLoading?: boolean
  onInquiryClick?: (inquiry: Inquiry) => void
  isStaff?: boolean
}

export function InquiriesTimelinePanel({
  inquiries,
  isLoading,
  onInquiryClick,
}: InquiriesTimelinePanelProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const safeInquiries = useMemo(() => {
    const list = Array.isArray(inquiries) ? inquiries : []
    if (statusFilter === 'all') return list
    return list.filter((i) => i.status === statusFilter)
  }, [inquiries, statusFilter])

  const sortedInquiries = useMemo(
    () =>
      [...safeInquiries].sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime()
      ),
    [safeInquiries]
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const list = sortedInquiries ?? []

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
        <h3 className="font-serif text-xl font-semibold">Inquiry history</h3>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(STATUS_LABELS) as InquiryStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <h4 className="mt-4 font-serif text-lg font-semibold">
              No inquiries yet
            </h4>
            <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
              Submit a stay inquiry from any destination page to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((inquiry) => {
              const listing = inquiry.listing
              const title =
                typeof listing === 'object' && listing
                  ? listing.title
                  : 'Destination'
              return (
                <Card
                  key={inquiry.id}
                  className="cursor-pointer transition-all duration-300 hover:border-accent/40 hover:shadow-card-hover"
                  onClick={() => onInquiryClick?.(inquiry)}
                >
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs text-muted-foreground">
                        {inquiry.reference}
                      </span>
                      <h4 className="mt-1 font-serif font-semibold truncate">
                        {title}
                      </h4>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {inquiry.check_in && (
                          <span>
                            Check-in: {formatDate(inquiry.check_in)}
                          </span>
                        )}
                        {inquiry.check_out && (
                          <span>
                            Check-out: {formatDate(inquiry.check_out)}
                          </span>
                        )}
                        {inquiry.guests_count != null && (
                          <span>{inquiry.guests_count} guests</span>
                        )}
                      </div>
                      {inquiry.total_amount != null && (
                        <p className="mt-1 text-sm font-medium">
                          ${inquiry.total_amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium',
                          STATUS_COLORS[inquiry.status] ??
                            'bg-gray-100 text-gray-800'
                        )}
                      >
                        {STATUS_LABELS[inquiry.status] ?? inquiry.status}
                      </span>
                      {inquiry.payment_link && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <a
                            href={inquiry.payment_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
