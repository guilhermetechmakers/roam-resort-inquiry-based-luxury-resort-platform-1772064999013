import { cn } from '@/lib/utils'

export interface HeroBarProps {
  title: string
  subtitle?: string
  backgroundImage?: string
  className?: string
}

export function HeroBar({
  title,
  subtitle,
  backgroundImage,
  className,
}: HeroBarProps) {
  return (
    <section
      className={cn(
        'relative flex min-h-[280px] flex-col justify-end overflow-hidden py-16 sm:min-h-[320px] sm:py-20',
        className
      )}
      aria-labelledby="terms-hero-title"
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
            ? 'bg-gradient-to-b from-primary/70 to-primary'
            : 'gradient-primary'
        )}
        aria-hidden
      />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1
            id="terms-hero-title"
            className="font-serif text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl"
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-4 text-lg text-primary-foreground/90">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
