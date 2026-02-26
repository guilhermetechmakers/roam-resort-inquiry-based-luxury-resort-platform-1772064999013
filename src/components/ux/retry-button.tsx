/**
 * Button with retry logic and debounced visibility.
 * Use for user-triggered retries on failed API calls.
 */

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface RetryButtonProps {
  onRetry: () => void
  label?: string
  isLoading?: boolean
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function RetryButton({
  onRetry,
  label = 'Try again',
  isLoading = false,
  className,
  variant = 'outline',
  size = 'sm',
}: RetryButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onRetry}
      disabled={isLoading}
      aria-busy={isLoading}
      aria-label={label}
      className={cn(
        variant === 'outline' && 'border-destructive/50 text-destructive hover:bg-destructive/10',
        className
      )}
    >
      <RefreshCw
        className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')}
        aria-hidden
      />
      {label}
    </Button>
  )
}
