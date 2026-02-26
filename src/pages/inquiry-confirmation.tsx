import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function InquiryConfirmationPage() {
  const { reference } = useParams<{ reference: string }>()

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="h-10 w-10 text-accent" />
        </div>
        <h1 className="mt-6 font-serif text-3xl font-bold">Inquiry Submitted</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for your interest. Our concierge team will respond within 24 hours.
        </p>
        {reference && (
          <p className="mt-4 rounded-lg bg-secondary/50 px-4 py-2 font-mono text-sm">
            Reference: {reference}
          </p>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          A confirmation email has been sent to your inbox.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link to="/profile">
            <Button>
              View My Inquiries
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/destinations">
            <Button variant="outline">Browse Destinations</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
