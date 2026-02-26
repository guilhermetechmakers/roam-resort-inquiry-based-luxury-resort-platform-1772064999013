import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface CTAStickyPanelProps {
  listingId: string
  slug?: string
  label?: string
  secondaryCopy?: string
  className?: string
}

const DEFAULT_LABEL = 'Request a Stay'
const DEFAULT_SECONDARY =
  'Submit an inquiry and our concierge will respond within 24 hours.'

export function CTAStickyPanel({
  listingId,
  slug,
  label = DEFAULT_LABEL,
  secondaryCopy = DEFAULT_SECONDARY,
  className,
}: CTAStickyPanelProps) {
  const contactHref = `/contact?destinationId=${encodeURIComponent(listingId)}${slug ? `&destination=${encodeURIComponent(slug)}` : ''}`
  const inquireHref = slug
    ? `/destinations/${encodeURIComponent(slug)}/inquire`
    : `/inquiry/${listingId}`
  return (
    <div
      className={cn(
        'sticky top-24 rounded-xl border border-border bg-card p-6 shadow-card',
        'transition-all duration-300 hover:shadow-card-hover',
        className
      )}
    >
      <h3 className="font-serif text-xl font-semibold">{label}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{secondaryCopy}</p>
      <div className="mt-6 flex flex-col gap-3">
        <Link to={contactHref} className="block">
          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
            size="lg"
          >
            {label}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        <Link
          to={inquireHref}
          className="text-center text-sm text-muted-foreground hover:text-accent transition-colors"
        >
          Or submit detailed stay inquiry
        </Link>
      </div>
      <Link
        to={contactHref}
        className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        Have questions? Contact us
      </Link>
    </div>
  )
}
