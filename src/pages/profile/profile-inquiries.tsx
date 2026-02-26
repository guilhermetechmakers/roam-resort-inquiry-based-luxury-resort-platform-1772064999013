import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  InquiriesTimelinePanel,
  InquiryDetailModal,
} from '@/components/profile'
import { useAuth } from '@/hooks/use-auth'
import { useMyInquiries } from '@/hooks/use-inquiries'
import type { Inquiry } from '@/types'

export function ProfileInquiries() {
  const { user, isLoading: authLoading } = useAuth()
  const {
    data: inquiries,
    isLoading: inquiriesLoading,
    isError,
    error,
    refetch,
  } = useMyInquiries(user?.id)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const safeInquiries = Array.isArray(inquiries) ? inquiries : []
  const isLoading = authLoading || inquiriesLoading

  const handleInquiryClick = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    setDetailOpen(true)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/profile"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
          aria-label="Back to profile overview"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to overview
        </Link>
        <h1 className="font-serif text-2xl font-bold sm:text-3xl text-foreground">
          Inquiries
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          View and manage your stay inquiries
        </p>

        <section
          className="mt-6 sm:mt-8"
          aria-labelledby="inquiries-heading"
          aria-describedby="inquiries-description"
        >
          <h2 id="inquiries-heading" className="sr-only">
            Your inquiries
          </h2>
          <p id="inquiries-description" className="sr-only">
            View and manage your stay inquiries. Click an inquiry to view details.
          </p>
          <InquiriesTimelinePanel
            inquiries={safeInquiries}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
            onInquiryClick={handleInquiryClick}
            isStaff={user?.role === 'host' || user?.role === 'concierge'}
          />
        </section>
      </div>

      <InquiryDetailModal
        inquiry={selectedInquiry}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
