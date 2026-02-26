import { InquiryHistoryRow } from './inquiry-history-row'
import { EmptyStateCard } from './empty-state-card'
import type { Inquiry } from '@/types'

export interface InquiryHistoryListProps {
  inquiries: Inquiry[] | null | undefined
  onViewDetails: (inquiry: Inquiry) => void
  onViewReceipt?: (inquiry: Inquiry) => void
  emptyMessage?: string
  emptyCta?: React.ReactNode
}

/**
 * List of inquiry rows with safe array handling.
 * Uses (inquiries ?? []).map(...) per runtime safety rules.
 */
export function InquiryHistoryList({
  inquiries,
  onViewDetails,
  onViewReceipt,
  emptyMessage,
  emptyCta,
}: InquiryHistoryListProps) {
  const safeInquiries = Array.isArray(inquiries) ? inquiries : []

  if (safeInquiries.length === 0) {
    return (
      <EmptyStateCard
        message={emptyMessage ?? 'No inquiries found'}
        submessage="Try adjusting your filters or explore our destinations to start a new inquiry."
        cta={emptyCta}
      />
    )
  }

  return (
    <div className="space-y-4" role="list">
      {(safeInquiries ?? []).map((inquiry) => (
        <InquiryHistoryRow
          key={inquiry.id}
          inquiry={inquiry}
          onViewDetails={onViewDetails}
          onViewReceipt={onViewReceipt}
        />
      ))}
    </div>
  )
}
