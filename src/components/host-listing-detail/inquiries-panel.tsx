/**
 * InquiriesPanel — Card-styled list of inquiries with MessageModal.
 * Pagination for large datasets; read-only presentation.
 */

import { useState, useMemo } from 'react'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { InquiryRow } from './inquiry-row'
import { MessageModal } from './message-modal'
import type { HostListingInquiry } from '@/types/host-listing-detail'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

export interface InquiriesPanelProps {
  listingId: string
  inquiries: HostListingInquiry[]
  isLoading?: boolean
  className?: string
}

export function InquiriesPanel({
  listingId,
  inquiries,
  isLoading,
  className,
}: InquiriesPanelProps) {
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(
    null
  )
  const [page, setPage] = useState(0)

  const safeInquiries = Array.isArray(inquiries) ? inquiries : []
  const totalPages = Math.ceil(safeInquiries.length / PAGE_SIZE) || 1
  const paginatedInquiries = useMemo(() => {
    const start = page * PAGE_SIZE
    return safeInquiries.slice(start, start + PAGE_SIZE)
  }, [safeInquiries, page])

  const handleViewInquiry = (inquiryId: string) => {
    setSelectedInquiryId(inquiryId)
  }

  const handleCloseModal = () => {
    setSelectedInquiryId(null)
  }

  return (
    <section
      className={cn('rounded-xl border border-border bg-card p-6 shadow-card', className)}
      aria-labelledby="inquiries-panel-heading"
    >
      <h2
        id="inquiries-panel-heading"
        className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        Related Inquiries
      </h2>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" aria-hidden />
          ))}
        </div>
      ) : safeInquiries.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 py-16 text-center"
          role="status"
        >
          <MessageSquare
            className="h-14 w-14 text-muted-foreground"
            aria-hidden
          />
          <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">
            No inquiries yet
          </h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Inquiries will appear here when guests submit requests for this
            listing. Concierge manages full inquiry details in the admin panel.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-4" role="list">
            {paginatedInquiries.map((inquiry) => (
              <li key={inquiry.id}>
                <InquiryRow
                  inquiry={inquiry}
                  onView={handleViewInquiry}
                />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages} ({safeInquiries.length}{' '}
                inquiry{safeInquiries.length !== 1 ? 's' : ''})
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label="Previous page"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  aria-label="Next page"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <MessageModal
        listingId={listingId}
        inquiryId={selectedInquiryId}
        isOpen={!!selectedInquiryId}
        onClose={handleCloseModal}
      />
    </section>
  )
}
