import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface ContactFormSuccessProps {
  reference?: string
  inquiryId?: string
  onSendAnother?: () => void
  className?: string
}

export function ContactFormSuccess({
  reference,
  inquiryId,
  onSendAnother,
  className,
}: ContactFormSuccessProps) {
  return (
    <Card
      className={cn(
        'border-accent/30 bg-card shadow-card animate-fade-in',
        className
      )}
    >
      <CardContent className="pt-8 pb-8">
        <div className="flex flex-col items-center text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent"
            aria-hidden
          >
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="mt-6 font-serif text-2xl font-semibold text-foreground">
            Thank you for reaching out
          </h2>
          <p className="mt-3 max-w-md text-muted-foreground">
            We&apos;ve received your inquiry. Our concierge team will respond
            within <strong>24–48 hours</strong> on business days.
          </p>
          {reference && (
            <p className="mt-2 text-sm text-muted-foreground">
              Reference: <strong className="text-foreground">{reference}</strong>
            </p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            A confirmation email has been sent to your inbox.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {inquiryId && (
              <Link to={`/contact/confirmation/${inquiryId}`}>
                <Button variant="outline" className="border-accent/50">
                  View confirmation
                </Button>
              </Link>
            )}
            {onSendAnother && (
              <Button
                onClick={onSendAnother}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Send another message
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
