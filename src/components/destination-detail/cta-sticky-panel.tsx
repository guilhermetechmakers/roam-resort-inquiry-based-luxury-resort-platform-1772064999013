import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface CTAStickyPanelProps {
  listingId: string
  label?: string
  secondaryCopy?: string
  className?: string
}

const DEFAULT_LABEL = 'Request a Stay'
const DEFAULT_SECONDARY =
  'Submit an inquiry and our concierge will respond within 24 hours.'

export function CTAStickyPanel({
  listingId,
  label = DEFAULT_LABEL,
  secondaryCopy = DEFAULT_SECONDARY,
  className,
}: CTAStickyPanelProps) {
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
      <Link to={`/inquiry/${listingId}`} className="mt-6 block">
        <Button
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
          size="lg"
        >
          {label}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>
    </div>
  )
}
