import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    error: profileErr,
    refetch: refetchProfile,
  } = useProfile(user?.id)
  const {
    data: inquiries,
    isLoading: inquiriesLoading,
    isError: inquiriesError,
    error: inquiriesErr,
    refetch: refetchInquiries,
  } = useMyInquiries(user?.id)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const safeInquiries = Array.isArray(inquiries) ? inquiries : []

  const handleInquiryClick = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    setDetailOpen(true)
  }

  const handleRetryProfile = () => {
    void refetchProfile()
  }

  const handleRetryInquiries = () => {
    void refetchInquiries()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-serif text-2xl font-bold sm:text-3xl text-foreground">
          Profile
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Manage your account and view your inquiries
        </p>

        {!user ? (
          <div className="mt-8 space-y-8 animate-fade-in" role="status" aria-label="Loading profile">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-10 w-40 rounded-md" />
              <Skeleton className="h-10 w-44 rounded-md" />
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            <ProfileHeaderCard
              profile={profile}
              isLoading={profileLoading}
              isError={profileError}
              error={profileErr ?? null}
              onRetry={handleRetryProfile}
            />

            <InquiriesTimelinePanel
              inquiries={safeInquiries}
              isLoading={inquiriesLoading}
              isError={inquiriesError}
              error={inquiriesErr ?? null}
              onRetry={handleRetryInquiries}
              onInquiryClick={handleInquiryClick}
              isStaff={user?.role === 'host' || user?.role === 'concierge'}
            />

            <div className="flex flex-wrap gap-4">
              <Link
                to="/profile/inquiries"
                aria-label="View all inquiries"
              >
                <Button
                  variant="outline"
                  className="transition-all duration-200 hover:scale-[1.02] hover:border-accent/50 hover:shadow-card"
                >
                  View all inquiries
                </Button>
              </Link>
              <Link
                to="/profile/history"
                aria-label="View transaction history"
              >
                <Button
                  variant="outline"
                  className="transition-all duration-200 hover:scale-[1.02] hover:border-accent/50 hover:shadow-card"
                >
                  Transaction history
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <InquiryDetailModal
        inquiry={selectedInquiry}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
