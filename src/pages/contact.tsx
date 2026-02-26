import { useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { ArrowRight, Mail, Clock, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContactFormPage } from '@/components/contact/contact-form-page'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export function ContactPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const destinationSlug = searchParams.get('destination') ?? undefined
  const destinationId = searchParams.get('destinationId') ?? undefined

  const destinationContext =
    destinationId || destinationSlug
      ? {
          destinationId: destinationId ?? undefined,
          slug: destinationSlug,
        }
      : undefined

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className={cn(
          'relative overflow-hidden',
          'bg-gradient-to-b from-primary/95 via-primary to-primary',
          'py-20 sm:py-28 lg:py-32',
          'px-4 sm:px-6 lg:px-8'
        )}
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
            Contact Us
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-primary-foreground/90 leading-relaxed">
            Have a question or ready to plan your stay? Our concierge team is here to help.
            Submit a general inquiry or request a personalized concierge experience.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/destinations">
              <Button
                variant="secondary"
                size="lg"
                className="bg-secondary/20 text-primary-foreground hover:bg-secondary/30 border-secondary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Browse Destinations
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Two-column: context panel + form */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
            {/* Context panel */}
            <div className="order-2 lg:order-1">
              <div className="sticky top-24 space-y-8">
                <div className="rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-accent/10 p-2">
                      <MessageCircle className="h-6 w-6 text-accent" />
                    </div>
                    <h2 className="font-serif text-xl font-semibold">How we can help</h2>
                  </div>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Choose <strong>General Question</strong> for support, feedback, or account
                    inquiries. Choose <strong>Concierge Request</strong> when you&apos;re ready to
                    plan a stay — we&apos;ll need your dates and guest count.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-6">
                  <h3 className="font-medium text-foreground">Response time</h3>
                  <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-5 w-5 shrink-0" />
                    <span>Within 24–48 hours on business days</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-5 w-5 shrink-0" />
                    <a
                      href="mailto:concierge@roamresort.com"
                      className="text-accent hover:underline"
                    >
                      concierge@roamresort.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="order-1 lg:order-2">
              <ContactFormPage
                user={user}
                destinationContext={destinationContext}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
