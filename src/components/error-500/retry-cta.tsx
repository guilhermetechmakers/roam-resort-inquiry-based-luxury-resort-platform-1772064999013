/**
 * RetryCTA - Bronze-gold button (#A97C50) with accessible label.
 * On click: invoke onRetry; if not provided, navigate to homepage.
 */
import { useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface RetryCTAProps {
  /** Callback when user clicks retry; if absent, navigates to / */
  onRetry?: () => void
  /** Optional loading state */
  isLoading?: boolean
  className?: string
}

export function RetryCTA({ onRetry, isLoading = false, className }: RetryCTAProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (typeof onRetry === 'function') {
      onRetry()
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      size="lg"
      className={cn(
        'bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98] shadow-accent-glow',
        className
      )}
      aria-label="Try again to reload the page"
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" aria-hidden />
          Retrying…
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" aria-hidden />
          Try Again
        </span>
      )}
    </Button>
  )
}
