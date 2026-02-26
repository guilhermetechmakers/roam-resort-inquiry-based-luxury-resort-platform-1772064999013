import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useGuestInquiries } from '@/hooks/use-guest-inquiries'
import type { Inquiry } from '@/types'
import {
  InquiryHistoryFilterBar,
  InquiryHistoryList,
  PaginationControls,
} from '@/components/inquiry-history'
import { InquiryDetailModal } from '@/components/profile'
import type { InquiryStatusFilter } from '@/api/guest-inquiries'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

function toDateString(d: Date | null): string {
  if (!d) return ''
  return d.toISOString().slice(0, 10)
}

/**
 * Profile Transaction History - authenticated Guest view of inquiry/transaction history.
 * Uses shadcn/ui components with filters, pagination, loading/error/empty states.
 */
export function ProfileHistory() {
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState<InquiryStatusFilter>('all')
  const [fromDate, setFromDate] = useState<Date | null>(null)
  const [toDate, setToDate] = useState<Date | null>(null)
  const [page, setPage] = useState(1)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filters = {
    status: statusFilter,
    fromDate: fromDate ? toDateString(fromDate) : null,
    toDate: toDate ? toDateString(toDate) : null,
    page,
    pageSize: PAGE_SIZE,
  }

  const fromStr = fromDate ? toDateString(fromDate) : ''
  const toStr = toDate ? toDateString(toDate) : ''
  const dateRangeInvalid =
    fromStr && toStr && new Date(fromStr) > new Date(toStr)

  const effectiveFilters = dateRangeInvalid
    ? { ...filters, fromDate: null, toDate: null }
    : filters

  const { data, isLoading, isError, refetch } = useGuestInquiries(
    user?.id,
    effectiveFilters
  )

  const inquiries = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasNext = page < totalPages
  const hasPrev = page > 1

  const handleStatusChange = useCallback((value: InquiryStatusFilter) => {
    setStatusFilter(value ?? 'all')
    setPage(1)
  }, [])

  const handleDateChange = useCallback(
    (field: 'from' | 'to', value: string) => {
      if (field === 'from') {
        setFromDate(value ? new Date(value) : null)
      } else {
        setToDate(value ? new Date(value) : null)
      }
      setPage(1)
    },
    []
  )

  const handleReset = useCallback(() => {
    setStatusFilter('all')
    setFromDate(null)
    setToDate(null)
    setPage(1)
  }, [])

  const handleViewDetails = useCallback((inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    setDetailOpen(true)
  }, [])

  const handleNextPage = useCallback(() => {
    if (hasNext) setPage((p) => p + 1)
  }, [hasNext])

  const handlePrevPage = useCallback(() => {
    if (hasPrev) setPage((p) => Math.max(1, p - 1))
  }, [hasPrev])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/profile"
          className={cn(
            'mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground',
            'transition-colors duration-200 hover:text-foreground focus:outline-none',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-md'
          )}
          aria-label="Back to profile"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Back to overview
        </Link>

        <header className="mb-6 sm:mb-8">
          <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
            Transaction history
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Past inquiries with status and receipts
          </p>
        </header>

        <Card className="mb-6 border-border shadow-card transition-all duration-300 sm:mb-8">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="sr-only">Filter inquiries</CardTitle>
            <CardDescription className="sr-only">
              Filter by status and date range
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <InquiryHistoryFilterBar
              currentStatus={statusFilter}
              startDate={fromStr}
              endDate={toStr}
              onStatusChange={handleStatusChange}
              onDateChange={handleDateChange}
              onReset={handleReset}
            />
            {dateRangeInvalid && (
              <p
                className="mt-4 text-sm text-destructive"
                role="alert"
              >
                From date must be before or equal to To date.
              </p>
            )}
          </CardContent>
        </Card>

        <Card
          className={cn(
            'border-border shadow-card transition-all duration-300',
            'hover:shadow-card-hover hover:border-accent/20'
          )}
        >
          <CardHeader>
            <CardTitle className="font-serif text-xl sm:text-2xl">
              Your inquiries
            </CardTitle>
            <CardDescription>
              View details and receipts for past inquiries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div
                className="space-y-4 animate-fade-in"
                role="status"
                aria-label="Loading inquiries"
              >
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : isError ? (
              <div
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl',
                  'border border-destructive/30 bg-destructive/5 p-8 sm:p-12 text-center',
                  'animate-fade-in'
                )}
                role="alert"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                  <RotateCw className="h-7 w-7 text-destructive" aria-hidden />
                </div>
                <p className="mt-4 font-medium text-foreground">
                  Something went wrong loading your inquiries.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please try again.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="mt-4 transition-all duration-200 hover:scale-[1.02] hover:border-accent/50"
                  aria-label="Retry loading inquiries"
                >
                  <RotateCw className="mr-2 h-4 w-4" aria-hidden />
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <InquiryHistoryList
                  inquiries={inquiries}
                  onViewDetails={handleViewDetails}
                  emptyMessage="No inquiries found"
                  emptyCta={
                    <Button
                      asChild
                      className="bg-accent text-accent-foreground transition-all duration-200 hover:scale-[1.02] hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <Link to="/destinations">Explore destinations</Link>
                    </Button>
                  }
                />

                {total > PAGE_SIZE && (
                  <div className="mt-6 sm:mt-8">
                    <PaginationControls
                      hasNext={hasNext}
                      hasPrev={hasPrev}
                      onNext={handleNextPage}
                      onPrev={handlePrevPage}
                      currentPage={page}
                      totalPages={totalPages}
                      totalItems={total}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <InquiryDetailModal
        inquiry={selectedInquiry}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
