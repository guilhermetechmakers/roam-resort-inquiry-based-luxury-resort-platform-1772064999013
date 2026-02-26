import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { InquiryGateLink } from './inquiry-gate-link'
import { CTAButton } from './cta-button'
import { cn } from '@/lib/utils'

export interface HeroCTA {
  label: string
  href?: string
  isPrimary?: boolean
  destinationSlug?: string
}

export interface HeroSectionProps {
  backgroundMedia?: string
  backgroundVideo?: string
  title: React.ReactNode
  subtitle: string
  ctas?: HeroCTA[]
  className?: string
}

const DEFAULT_CTAS: HeroCTA[] = [
  { label: 'Request a Stay', isPrimary: true },
  { label: 'Explore Destinations', href: '/destinations', isPrimary: false },
]

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920'

export function HeroSection({
  backgroundMedia = HERO_IMAGE,
  backgroundVideo,
  title,
  subtitle,
  ctas = DEFAULT_CTAS,
  className,
}: HeroSectionProps) {
  const primaryCta = ctas.find((c) => c.isPrimary) ?? ctas[0]
  const secondaryCta = ctas.find((c) => !c.isPrimary) ?? ctas[1]

  return (
    <section
      className={cn(
        'relative min-h-[90vh] flex flex-col justify-end overflow-hidden',
        className
      )}
      aria-label="Hero"
    >
      {/* Background media */}
      {backgroundVideo ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundMedia})` }}
          role="img"
          aria-label="Hero background"
        />
      )}

      {/* Dark overlay for readability */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-primary"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        <div className="max-w-2xl animate-fade-in-up">
          <h1 className="font-serif text-5xl font-bold tracking-tight text-primary-foreground sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-6 text-lg text-primary-foreground/90 max-w-xl">
            {subtitle}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            {primaryCta && (
              <InquiryGateLink
                destinationSlug={primaryCta.destinationSlug}
                label={primaryCta.label}
                variant="primary"
              />
            )}
            {secondaryCta?.href && (
              <CTAButton
                variant="secondary"
                asChild
                className="border-primary-foreground/50 text-primary-foreground bg-white/10 hover:bg-white/20 hover:border-primary-foreground"
              >
                <Link to={secondaryCta.href} className="inline-flex items-center gap-2">
                  {secondaryCta.label}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </CTAButton>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
