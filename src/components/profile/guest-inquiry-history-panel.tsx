import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  InquiryHistoryFilterBar,
  InquiryHistoryList,
  EmptyStateCard,
  PaginationControls,
} from './inquiry-history'
import { useGuestInquiryHistory, PAGE_SIZE, type InquiryHistoryStatusFilter } from '@/hooks/use-guest-inquiry-history'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Inquiry } from '@/types'

export interface GuestInquiryHistoryPanelProps {
  userId: string | undefined
  onInquiryClick?: (inquiry: Inquiry) => void
}

export function GuestInquiryHistoryPanel({
  userId,
  onInquiryClick,
}: GuestInquiryHistoryPanelProps) {
  const [statusFilter, setStatusFilter] = useState<InquiryHistoryStatusFilter>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [page, setPage] = useState<number>(1)

  const filters = {
    status: statusFilter,
    fromDate: fromDate || null,
    toDate: toDate || null,
    page,
    pageSize: PAGE_SIZE,
  }

  const { data, isLoading, isError, refetch } = useGuestInquiryHistory(userId, filters)

  const { data: inquiries = [], total = 0 } = data ?? {}
  const safeInquiries = Array.isArray(inquiries) ? inquiries : []
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleStatusChange = useCallback((value: InquiryHistoryStatusFilter) => {
    setStatusFilter(value)
    setPage(1)
  }, [])

  const handleDateChange = useCallback((type: 'from' | 'to', value: string) => {
    if (type === 'from') {
      setFromDate(value)
      if (toDate && value && value > toDate) {
        setToDate('')
        toast.error('From date cannot be after To date')
      }
    } else {
      if (fromDate && value && value < fromDate) {
        toast.error('To date cannot be before From date')
        return
      }
      setToDate(value)
    }
    setPage(1)
  }, [fromDate, toDate])

  const handleReset = useCallback(() => {
    setStatusFilter('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }, [])

  const handleViewDetails = useCallback(
    (inquiry: Inquiry) => {
      onInquiryClick?.(inquiry)
    },
    [onInquiryClick]
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground">
              Something went wrong loading your inquiries.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-3 py-2"
              aria-label="Retry loading inquiries"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-6">
        <h3 className="font-serif text-xl font-semibold">
          Inquiry & transaction history
        </h3>
        <InquiryHistoryFilterBar
          currentStatus={statusFilter}
          startDate={fromDate}
          endDate={toDate}
          onStatusChange={handleStatusChange}
          onDateChange={handleDateChange}
          onReset={handleReset}
        />
      </CardHeader>
      <CardContent className="space-y-6">
        {safeInquiries.length === 0 ? (
          <EmptyStateCard
            message="Your past inquiries and receipts will appear here. Start by exploring our destinations and submitting an inquiry."
            cta={{ label: 'Explore destinations', to: '/destinations' }}
          />
        ) : (
          <>
            <InquiryHistoryList
              inquiries={safeInquiries}
              onViewDetails={handleViewDetails}
            />
            {totalPages > 1 && (
              <PaginationControls
                hasNext={page < totalPages}
                hasPrev={page > 1}
                onNext={() => setPage((p) => Math.min(p + 1, totalPages))}
                onPrev={() => setPage((p) => Math.max(p - 1, 1))}
                currentPage={page}
                totalPages={totalPages}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
