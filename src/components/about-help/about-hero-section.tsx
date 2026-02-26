import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface AboutHeroSectionProps {
  title: string
  subtitle?: string
  backgroundImage?: string
  ctaLabel?: string
  ctaHref?: string
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
  className?: string
}

export function AboutHeroSection({
  title,
  subtitle,
  backgroundImage,
  ctaLabel = 'Request a Stay',
  ctaHref = '/destinations',
  secondaryCtaLabel = 'Learn How to Inquire',
  secondaryCtaHref = '#how-it-works',
  className,
}: AboutHeroSectionProps) {
  return (
    <section
      className={cn(
        'relative flex min-h-[400px] flex-col justify-end overflow-hidden py-20 sm:min-h-[480px] sm:py-24',
        className
      )}
      aria-labelledby="about-hero-title"
    >
      {backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
          aria-hidden
        />
      ) : null}
      <div
        className={cn(
          'absolute inset-0',
          backgroundImage
            ? 'bg-gradient-to-b from-primary/80 via-primary/60 to-primary'
            : 'gradient-primary'
        )}
        aria-hidden
      />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1
            id="about-hero-title"
            className="font-serif text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl"
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-6 text-lg text-primary-foreground/90 sm:text-xl">
              {subtitle}
            </p>
          ) : null}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to={ctaHref}>
              <Button
                size="lg"
                className="bg-accent text-accent-foreground shadow-accent-glow hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
                aria-label={ctaLabel}
              >
                {ctaLabel}
              </Button>
            </Link>
            <a
              href={secondaryCtaHref}
              className="inline-flex items-center justify-center rounded-md border border-primary-foreground/40 bg-transparent px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary transition-colors duration-200"
              aria-label={secondaryCtaLabel}
            >
              {secondaryCtaLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
