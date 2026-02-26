import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { HeroSection } from './hero-section'
import { DestinationHighlightsCarousel } from './destination-highlights-carousel'
import { EditorialTeasersGrid } from './editorial-teasers-grid'
import { InquiryGateLink } from './inquiry-gate-link'
import { CTAButton } from './cta-button'
import { useHighlightedDestinations, useEditorials } from '@/hooks/use-destinations'
import { cn } from '@/lib/utils'
import type { DestinationCard } from '@/types'
import type { EditorialTeaser } from '@/types'

const HERO_TITLE = (
  <>
    Curated Stays.
    <br />
    <span className="text-secondary">Inquiry-First.</span>
  </>
)
const HERO_SUBTITLE =
  'Discover editorial destination pages and submit high-quality stay inquiries. Our concierge team personalizes every experience.'

export interface LandingLayoutProps {
  className?: string
}

export function LandingLayout({ className }: LandingLayoutProps) {
  const { data: destinationsData, isLoading: destinationsLoading } =
    useHighlightedDestinations()
  const { data: editorialsData, isLoading: editorialsLoading } = useEditorials()

  const destinations: DestinationCard[] = Array.isArray(destinationsData)
    ? destinationsData
    : []
  const teasers: EditorialTeaser[] = Array.isArray(editorialsData)
    ? editorialsData
    : []

  return (
    <div className={cn('min-h-screen', className)}>
      <HeroSection
        title={HERO_TITLE}
        subtitle={HERO_SUBTITLE}
        ctas={[
          { label: 'Request a Stay', isPrimary: true },
          { label: 'Explore Destinations', href: '/destinations', isPrimary: false },
        ]}
      />

      <DestinationHighlightsCarousel
        destinations={destinations}
        isLoading={destinationsLoading}
      />

      <EditorialTeasersGrid
        teasers={teasers}
        isLoading={editorialsLoading}
      />

      {/* CTA Section */}
      <section className="border-t border-border bg-secondary/30 py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
            Ready to Roam?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Submit an inquiry and our concierge team will craft a personalized
            experience for your stay.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <InquiryGateLink
              label="Request a Stay"
              variant="primary"
              className="inline-flex"
            />
            <CTAButton variant="secondary" asChild>
              <Link to="/destinations" className="inline-flex items-center gap-2">
                Explore Destinations
                <ArrowRight className="h-5 w-5" />
              </Link>
            </CTAButton>
          </div>
        </div>
      </section>
    </div>
  )
}
