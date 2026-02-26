import { InquiryHistoryRow } from './inquiry-history-row'
import type { Inquiry } from '@/types'

export interface InquiryHistoryListProps {
  inquiries: Inquiry[]
  onViewDetails: (inquiry: Inquiry) => void
  onViewReceipt?: (url: string) => void
}

export function InquiryHistoryList({
  inquiries,
  onViewDetails,
  onViewReceipt,
}: InquiryHistoryListProps) {
  const safeList = Array.isArray(inquiries) ? inquiries : []

  return (
    <div
      className="space-y-4"
      role="list"
      aria-label="Inquiry history"
    >
      {(safeList ?? []).map((inquiry) => (
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
