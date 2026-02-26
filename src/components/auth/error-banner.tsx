import { AlertCircle } from 'lucide-react'
import { RetryButton } from '@/components/ux'
import { cn } from '@/lib/utils'

export interface ErrorBannerProps {
  message: string
  subMessage?: string
  onRetry?: () => void
  className?: string
}

export function ErrorBanner({
  message,
  subMessage,
  onRetry,
  className,
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive animate-fade-in',
        className
      )}
    >
      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="font-medium">{message}</p>
        {subMessage && (
          <p className="mt-1 text-sm opacity-90">{subMessage}</p>
        )}
        {onRetry && (
          <RetryButton
            onRetry={onRetry}
            label="Try again"
            className="mt-3"
          />
        )}
      </div>
    </div>
  )
}
