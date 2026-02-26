import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  InquiriesTimelinePanel,
  InquiryDetailModal,
} from '@/components/profile'
import { useAuth } from '@/contexts/auth-context'
import { useMyInquiries } from '@/hooks/use-inquiries'
import type { Inquiry } from '@/types'

export function ProfileInquiries() {
  const { user } = useAuth()
  const { data: inquiries, isLoading } = useMyInquiries(user?.id)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const safeInquiries = Array.isArray(inquiries) ? inquiries : []

  const handleInquiryClick = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    setDetailOpen(true)
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/profile"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to overview
        </Link>
        <h1 className="font-serif text-3xl font-bold">Inquiries</h1>
        <p className="mt-2 text-muted-foreground">
          View and manage your stay inquiries
        </p>

        <div className="mt-8">
          <InquiriesTimelinePanel
            inquiries={safeInquiries}
            isLoading={isLoading}
            onInquiryClick={handleInquiryClick}
            isStaff={user?.role === 'host' || user?.role === 'concierge'}
          />
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
