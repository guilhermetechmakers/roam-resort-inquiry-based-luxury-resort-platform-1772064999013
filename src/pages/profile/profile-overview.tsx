import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  ProfileHeaderCard,
  InquiriesTimelinePanel,
  InquiryDetailModal,
} from '@/components/profile'
import { useAuth } from '@/hooks/use-auth'
import { useProfile } from '@/hooks/use-profile'
import { useMyInquiries } from '@/hooks/use-inquiries'
import type { Inquiry } from '@/types'

export function ProfileOverview() {
  const { user } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id)
  const { data: inquiries, isLoading: inquiriesLoading } = useMyInquiries(user?.id)
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
        <h1 className="font-serif text-3xl font-bold">Profile</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account and view your inquiries
        </p>

        <div className="mt-8 space-y-8">
          <ProfileHeaderCard
            profile={profile}
            isLoading={profileLoading}
          />

          <InquiriesTimelinePanel
            inquiries={safeInquiries}
            isLoading={inquiriesLoading}
            onInquiryClick={handleInquiryClick}
            isStaff={user?.role === 'host' || user?.role === 'concierge'}
          />

          <div className="flex flex-wrap gap-4">
            <Link to="/profile/inquiries">
              <Button variant="outline">View all inquiries</Button>
            </Link>
            <Link to="/profile/history">
              <Button variant="outline">Transaction history</Button>
            </Link>
          </div>
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
