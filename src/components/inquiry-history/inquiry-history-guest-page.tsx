import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useGuestInquiries } from '@/hooks/use-guest-inquiries'
import type { Inquiry } from '@/types'
import {
  InquiryHistoryFilterBar,
  InquiryHistoryList,
  PaginationControls,
} from './index'
import { InquiryDetailModal } from '@/components/profile'
import type { InquiryStatusFilter } from '@/api/guest-inquiries'

const PAGE_SIZE = 10

function toDateString(d: Date | null): string {
  if (!d) return ''
  return d.toISOString().slice(0, 10)
}

export function InquiryHistoryGuestPage() {
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
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/profile"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back to profile"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to overview
        </Link>

        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Transaction history
          </h1>
          <p className="mt-2 text-muted-foreground">
            Past inquiries with status and receipts
          </p>
        </header>

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

        <div className="mt-8">
          {isLoading ? (
            <div className="space-y-4 animate-fade-in">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : isError ? (
            <div
              className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center"
              role="alert"
            >
              <p className="font-medium text-foreground">
                Something went wrong loading your inquiries.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please try again.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-4"
                aria-label="Retry loading inquiries"
              >
                <RotateCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : (
            <>
              <InquiryHistoryList
                inquiries={inquiries}
                onViewDetails={handleViewDetails}
              />

              {total > PAGE_SIZE && (
                <div className="mt-8">
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
        </div>
      </div>

      <InquiryDetailModal
        inquiry={selectedInquiry}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
