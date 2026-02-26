import { useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AuthGateModal,
  DestinationHeaderCard,
  InquiryForm,
} from '@/components/inquiry'
import type { AttachmentFile } from '@/components/inquiry'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useListingById } from '@/hooks/use-listings'
import { useCreateInquiry } from '@/hooks/use-inquiries'
import { Skeleton } from '@/components/ui/skeleton'
import type { ContactPreferences } from '@/types'

const DRAFT_KEY_PREFIX = 'roam-inquiry-draft-'

function loadDraft(listingId: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY_PREFIX}${listingId}`)
    if (!raw) return null
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

function saveDraft(listingId: string, data: Record<string, unknown>) {
  try {
    localStorage.setItem(`${DRAFT_KEY_PREFIX}${listingId}`, JSON.stringify(data))
  } catch {
    // Ignore
  }
}

export function InquiryFormPage() {
  const { listingId } = useParams<{ listingId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: listing, isLoading } = useListingById(listingId)
  const createInquiry = useCreateInquiry()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const draft = loadDraft(listingId ?? '') ?? null
  const existingDraft = draft
    ? {
        arrival_date: (draft.arrival_date as string) ?? '',
        departure_date: (draft.departure_date as string) ?? '',
        flexible_dates: (draft.flexible_dates as boolean) ?? false,
        guests: (draft.guests as number) ?? 2,
        room_prefs: Array.isArray(draft.room_prefs) ? (draft.room_prefs as string[]) : [],
        budget_hint: (draft.budget_hint as string) ?? '',
        notes: (draft.notes as string) ?? '',
        contact_email: (draft.contact_email as boolean) ?? true,
        contact_sms: (draft.contact_sms as boolean) ?? false,
        contact_phone: (draft.contact_phone as boolean) ?? false,
      }
    : undefined

  const toContactPrefs = useCallback(
    (data: {
      contact_email?: boolean
      contact_sms?: boolean
      contact_phone?: boolean
    }): ContactPreferences => ({
      email: data.contact_email ?? true,
      sms: data.contact_sms ?? false,
      phone: data.contact_phone ?? false,
    }),
    []
  )

  const handleSaveDraft = useCallback(
    (data: {
      arrival_date: string
      departure_date: string
      flexible_dates: boolean
      guests: number
      room_prefs: string[]
      budget_hint?: string
      notes?: string
      contact_email?: boolean
      contact_sms?: boolean
      contact_phone?: boolean
      attachments?: AttachmentFile[]
    }) => {
      if (!listingId) return
      saveDraft(listingId, {
        arrival_date: data.arrival_date,
        departure_date: data.departure_date,
        flexible_dates: data.flexible_dates,
        guests: data.guests,
        room_prefs: data.room_prefs ?? [],
        budget_hint: data.budget_hint ?? '',
        notes: data.notes ?? '',
        contact_email: data.contact_email ?? true,
        contact_sms: data.contact_sms ?? false,
        contact_phone: data.contact_phone ?? false,
      })
      toast.success('Draft saved')
    },
    [listingId]
  )

  const handleSubmit = useCallback(
    async (data: {
      arrival_date: string
      departure_date: string
      flexible_dates: boolean
      guests: number
      room_prefs: string[]
      budget_hint?: string
      notes?: string
      contact_email?: boolean
      contact_sms?: boolean
      contact_phone?: boolean
      attachments?: AttachmentFile[]
    }) => {
      if (!user || !listingId || !listing) return
      try {
        const contact_preferences = toContactPrefs(data)
        const inquiry = await createInquiry.mutateAsync({
          guest_id: user.id,
          listing_id: listingId,
          check_in: data.arrival_date,
          check_out: data.departure_date,
          guests_count: data.guests,
          message: data.notes,
          flexible_dates: data.flexible_dates,
          room_prefs: data.room_prefs ?? [],
          budget_hint: data.budget_hint,
          contact_preferences,
          attachments: [], // TODO: upload attachments via API and pass URLs
        })
        if (listingId) {
          try {
            localStorage.removeItem(`${DRAFT_KEY_PREFIX}${listingId}`)
          } catch {
            // Ignore
          }
        }
        toast.success('Inquiry submitted successfully!')
        navigate(`/inquiry/confirmation/${inquiry.reference}`)
      } catch (err) {
        toast.error((err as Error).message ?? 'Failed to submit inquiry')
      }
    },
    [user, listingId, listing, createInquiry, toContactPrefs, navigate]
  )

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            Sign in to submit an inquiry
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            Create an account or sign in to request a stay. Our concierge team will respond within
            24 hours.
          </p>
          <div className="mt-6 flex gap-4">
            <Button
              onClick={() => setShowAuthModal(true)}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Sign In
            </Button>
            <Link to={`/login?redirect=${encodeURIComponent(`/inquiry/${listingId ?? ''}`)}`}>
              <Button variant="outline">Create Account</Button>
            </Link>
          </div>
        </div>
        <AuthGateModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          redirectTo={`/inquiry/${listingId ?? ''}`}
          user={user}
        />
      </>
    )
  }

  if (!listingId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <p className="text-muted-foreground">No listing selected.</p>
        <Link to="/destinations" className="mt-4">
          <Button>Browse Destinations</Button>
        </Link>
      </div>
    )
  }

  if (isLoading && !listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="mt-8 h-96 rounded-xl" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <p className="text-muted-foreground">Listing not found.</p>
        <Link to="/destinations" className="mt-4">
          <Button>Browse Destinations</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="space-y-10">
        <div className="animate-fade-in-up">
          <DestinationHeaderCard destination={listing} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="font-serif text-2xl font-bold">Request a Stay</h2>
          <p className="mt-2 text-muted-foreground">
            Complete the form below. Our concierge team will respond within 24 hours.
          </p>

          <InquiryForm
            destinationId={listingId}
            destinationName={listing.title ?? 'Destination'}
            existingDraft={existingDraft}
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            isSubmitting={createInquiry.isPending}
            className="mt-8"
          />
        </div>
      </div>
    </div>
  )
}
