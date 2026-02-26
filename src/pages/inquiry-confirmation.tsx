import { useParams, Link, Navigate } from 'react-router-dom'
import {
  CheckCircle2,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  FileText,
  Mail,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useInquiryByIdOrReference } from '@/hooks/use-inquiries'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Inquiry, Attachment } from '@/types'

/** Normalized attachment shape for display (handles both string[] and Attachment[] from API) */
interface NormalizedAttachment {
  id: string
  filename: string
  url?: string
  size?: number
  mimeType?: string
}

function normalizeAttachments(attachments: Inquiry['attachments']): NormalizedAttachment[] {
  if (!attachments) return []
  if (!Array.isArray(attachments)) return []
  return attachments.map((a, idx) => {
    if (typeof a === 'string') {
      return { id: `att-${idx}`, filename: a.split('/').pop() ?? 'attachment', url: a }
    }
    const att = a as Attachment & { filename?: string; mimeType?: string }
    return {
      id: att.id ?? `att-${idx}`,
      filename: att.name ?? att.filename ?? 'attachment',
      url: att.file_url ?? (att as { url?: string }).url,
      size: att.size,
      mimeType: att.mime_type ?? att.mimeType,
    }
  })
}

function formatFileSize(bytes?: number): string {
  if (bytes == null || bytes === 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// --- ConfirmationHeader ---
function ConfirmationHeader({ reference }: { reference: string }) {
  return (
    <header className="text-center" aria-label="Inquiry confirmation">
      <div
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 animate-fade-in"
        aria-hidden
      >
        <CheckCircle2 className="h-12 w-12 text-accent" />
      </div>
      <h1 className="mt-8 font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl animate-fade-in-up">
        Inquiry Confirmed
      </h1>
      <p className="mt-4 font-mono text-lg font-medium text-accent sm:text-xl" aria-label="Reference number">
        {reference || '—'}
      </p>
    </header>
  )
}

// --- InquirySummaryCard ---
interface InquirySummaryCardProps {
  destinationName: string
  checkIn?: string
  checkOut?: string
  guests?: number
  messageSnippet?: string
  roomPrefs?: string[]
}

function InquirySummaryCard({
  destinationName,
  checkIn,
  checkOut,
  guests,
  messageSnippet,
  roomPrefs,
}: InquirySummaryCardProps) {
  const snippet = (messageSnippet ?? '').slice(0, 200)
  const hasSnippet = snippet.length > 0
  const roomPrefsList = Array.isArray(roomPrefs) ? roomPrefs : []

  return (
    <Card className="border-border/80 bg-card/50 shadow-card transition-all duration-300 hover:shadow-card-hover">
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Inquiry Summary
        </h2>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
          <div>
            <p className="text-sm text-muted-foreground">Destination</p>
            <p className="font-serif text-lg font-semibold text-foreground">
              {destinationName || '—'}
            </p>
          </div>
        </div>

        {(checkIn || checkOut) && (
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
            <div>
              <p className="text-sm text-muted-foreground">Dates</p>
              <p className="text-foreground">
                {checkIn ? formatDate(checkIn) : '—'}
                {checkOut && ` — ${formatDate(checkOut)}`}
              </p>
            </div>
          </div>
        )}

        {guests != null && guests > 0 && (
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
            <div>
              <p className="text-sm text-muted-foreground">Guests</p>
              <p className="text-foreground">{guests}</p>
            </div>
          </div>
        )}

        {roomPrefsList.length > 0 && (
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
            <div>
              <p className="text-sm text-muted-foreground">Room preferences</p>
              <p className="text-foreground">{roomPrefsList.join(', ')}</p>
            </div>
          </div>
        )}

        {hasSnippet && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Message</p>
            <p className="mt-1 text-foreground/90">{snippet}{snippet.length >= 200 ? '…' : ''}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// --- NextStepsPanel ---
function NextStepsPanel() {
  return (
    <Card className="border-border/80 bg-card/50 shadow-card transition-all duration-300 hover:shadow-card-hover">
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Next Steps
        </h2>
      </CardHeader>
      <CardContent className="space-y-8 pt-0">
        <section>
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Expected Concierge Response Time
          </h3>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Our concierge team will respond within <strong className="text-foreground">24–48 hours</strong>.
            Response times may be slightly longer during peak periods or holidays.
          </p>
        </section>

        <section>
          <h3 className="font-serif text-lg font-semibold text-foreground">Payment Flow</h3>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            When your stay is confirmed, our concierge will send you a secure payment link. Payment is
            processed manually via Stripe Connect. You will receive clear instructions at the time
            your reservation is confirmed. No payment is required until your stay is confirmed.
          </p>
        </section>

        <section>
          <h3 className="font-serif text-lg font-semibold text-foreground">Need Help?</h3>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Contact our support team:
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <a
                href="mailto:concierge@roamresort.com"
                className="inline-flex items-center gap-2 text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                aria-label="Email concierge"
              >
                <Mail className="h-4 w-4" />
                concierge@roamresort.com
              </a>
            </li>
            <li>
              <Link
                to="/help"
                className="inline-flex items-center gap-2 text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                aria-label="Visit help center"
              >
                <HelpCircle className="h-4 w-4" />
                Help Center
              </Link>
            </li>
          </ul>
        </section>
      </CardContent>
    </Card>
  )
}

// --- EmailConfirmationBadge ---
interface EmailConfirmationBadgeProps {
  emailConfirmed?: boolean
  onResend?: () => void
  isResending?: boolean
}

function EmailConfirmationBadge({
  emailConfirmed = true,
  onResend,
  isResending = false,
}: EmailConfirmationBadgeProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
      role="status"
      aria-label={emailConfirmed ? 'Confirmation email sent' : 'Confirmation email pending'}
    >
      <Mail className="h-4 w-4 text-accent" aria-hidden />
      <span className="text-sm text-muted-foreground">
        {emailConfirmed
          ? 'A confirmation email has been sent to your inbox with your reference.'
          : 'Confirmation email will be sent shortly.'}
      </span>
      {onResend && (
        <button
          type="button"
          onClick={onResend}
          disabled={isResending}
          className="text-sm font-medium text-accent hover:underline disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
          aria-label="Resend confirmation email"
        >
          {isResending ? 'Sending…' : 'Resend'}
        </button>
      )}
    </div>
  )
}

// --- AttachmentRow ---
interface AttachmentRowProps {
  attachments: NormalizedAttachment[]
}

function AttachmentRow({ attachments }: AttachmentRowProps) {
  const list = attachments ?? []
  if (list.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Attachments
      </p>
      <ul className="space-y-2" role="list">
        {list.map((att) => (
          <li
            key={att.id}
            className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/20 px-3 py-2"
          >
            <FileText className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            <span className="truncate text-sm text-foreground">{att.filename}</span>
            {att.size != null && att.size > 0 && (
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {formatFileSize(att.size)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

// --- ActionsBar ---
function ActionsBar() {
  return (
    <div
      className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6"
      role="navigation"
      aria-label="Confirmation actions"
    >
      <Link
        to="/profile"
        className="inline-flex items-center justify-center"
        aria-label="View my inquiries"
      >
        <Button
          size="lg"
          className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 shadow hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          View My Inquiries
          <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
        </Button>
      </Link>
      <Link
        to="/destinations"
        className="inline-flex items-center justify-center"
        aria-label="Return to destinations"
      >
        <Button
          variant="outline"
          size="lg"
          className="w-full sm:w-auto border-border hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          Return to Destinations
        </Button>
      </Link>
    </div>
  )
}

// --- LoadingSkeletons ---
function ConfirmationLoadingSkeletons() {
  return (
    <div className="mx-auto max-w-2xl space-y-8" aria-busy="true" aria-label="Loading inquiry details">
      <div className="flex flex-col items-center">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="mt-6 h-10 w-64" />
        <Skeleton className="mt-4 h-6 w-32" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-12 w-48" />
      <div className="flex justify-center gap-4">
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-12 w-44" />
      </div>
    </div>
  )
}

// --- Main Page ---
export function InquiryConfirmationPage() {
  const { inquiryId, reference } = useParams<{ inquiryId?: string; reference?: string }>()
  const idOrRef = inquiryId ?? reference ?? ''
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: inquiry, isLoading, error } = useInquiryByIdOrReference(idOrRef, user?.id)

  // Auth guard: redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(`/inquiries/confirmation/${idOrRef}`)}`}
        replace
      />
    )
  }

  if (authLoading) {
    return (
      <div className="min-h-[80vh] px-4 py-16">
        <ConfirmationLoadingSkeletons />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-[80vh] px-4 py-16">
        <ConfirmationLoadingSkeletons />
      </div>
    )
  }

  if (error || !inquiry) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
        <p className="text-muted-foreground">Inquiry not found or you don&apos;t have access to view it.</p>
        <Link to="/destinations" className="mt-6">
          <Button variant="outline">Return to Destinations</Button>
        </Link>
      </div>
    )
  }

  if (!idOrRef) {
    return (
      <Navigate to="/destinations" replace />
    )
  }

  // Safe data extraction with defaults
  const displayRef = inquiry.reference ?? ''
  const listing = inquiry.listing
  const destinationName =
    typeof listing === 'object' && listing != null && 'title' in listing
      ? (listing.title as string) ?? 'Destination'
      : 'Destination'
  const checkIn = inquiry.check_in ?? undefined
  const checkOut = inquiry.check_out ?? undefined
  const guests = inquiry.guests_count ?? undefined
  const message = inquiry.message ?? ''
  const roomPrefs = Array.isArray(inquiry.room_prefs) ? inquiry.room_prefs : []
  const attachments = normalizeAttachments(inquiry.attachments)

  return (
    <div className="min-h-[80vh] px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl space-y-12">
        <ConfirmationHeader reference={displayRef} />

        <section className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <InquirySummaryCard
            destinationName={destinationName}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
            messageSnippet={message}
            roomPrefs={roomPrefs}
          />

          {attachments.length > 0 && (
            <Card className={cn('border-border/80 bg-card/50')}>
              <CardContent className="pt-6">
                <AttachmentRow attachments={attachments} />
              </CardContent>
            </Card>
          )}

          <NextStepsPanel />

          <EmailConfirmationBadge emailConfirmed={true} />

          <div className="pt-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <ActionsBar />
          </div>
        </section>
      </div>
    </div>
  )
}
