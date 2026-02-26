import { useParams, Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function ContactConfirmationPage() {
  const { inquiryId } = useParams<{ inquiryId: string }>()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <Card className={cn('max-w-md w-full border-accent/30 shadow-card animate-fade-in')}>
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h1 className="mt-6 font-serif text-2xl font-semibold text-foreground">
              Inquiry submitted
            </h1>
            <p className="mt-3 text-muted-foreground">
              Thank you for reaching out. Our concierge team will respond within 24–48 hours on
              business days.
            </p>
            {inquiryId && (
              <p className="mt-2 text-sm text-muted-foreground">
                Reference: <strong className="text-foreground">{inquiryId.slice(0, 8)}…</strong>
              </p>
            )}
            <Link to="/contact" className="mt-8">
              <Button variant="outline" className="border-accent/50">
                Submit another inquiry
              </Button>
            </Link>
            <Link to="/destinations" className="mt-4 block">
              <Button variant="ghost" className="text-accent hover:text-accent/90">
                Browse destinations
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
