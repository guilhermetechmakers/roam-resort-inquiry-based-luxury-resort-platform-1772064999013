import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export type TokenStatus = 'loading' | 'success' | 'error'

export interface TokenStatusCardProps {
  status: TokenStatus
  message: string
  detail?: string
  className?: string
}

const statusConfig: Record<
  TokenStatus,
  { icon: typeof CheckCircle2; iconClassName: string; cardClassName: string }
> = {
  loading: {
    icon: Loader2,
    iconClassName: 'text-accent animate-spin',
    cardClassName: 'border-border bg-card',
  },
  success: {
    icon: CheckCircle2,
    iconClassName: 'text-emerald-600 dark:text-emerald-400',
    cardClassName: 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/20',
  },
  error: {
    icon: AlertCircle,
    iconClassName: 'text-destructive',
    cardClassName: 'border-destructive/30 bg-destructive/5 dark:bg-destructive/10',
  },
}

export function TokenStatusCard({
  status,
  message,
  detail,
  className,
}: TokenStatusCardProps) {
  const config = statusConfig[status] ?? statusConfig.loading
  const Icon = config.icon

  return (
    <Card
      className={cn(
        'border-border bg-card/95 backdrop-blur-sm shadow-card transition-all duration-300',
        config.cardClassName,
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`Verification status: ${status}`}
    >
      <CardHeader className="text-center pb-2">
        <div
          className={cn(
            'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2',
            status === 'success' && 'border-emerald-200 bg-emerald-100/50 dark:border-emerald-800 dark:bg-emerald-900/30',
            status === 'error' && 'border-destructive/30 bg-destructive/10',
            status === 'loading' && 'border-accent/30 bg-accent/5'
          )}
        >
          {status === 'loading' ? (
            <Icon className={cn('h-8 w-8', config.iconClassName)} aria-hidden />
          ) : (
            <Icon className={cn('h-8 w-8', config.iconClassName)} aria-hidden />
          )}
        </div>
        <CardTitle className="font-serif text-2xl font-semibold text-foreground">
          {status === 'loading' ? (
            <Skeleton className="mx-auto h-7 w-48" />
          ) : (
            message
          )}
        </CardTitle>
        {detail && (
          <CardDescription className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            {detail}
          </CardDescription>
        )}
      </CardHeader>
      {status === 'loading' && (
        <CardContent className="pt-0">
          <p className="text-center text-sm text-muted-foreground">
            Verifying your email...
          </p>
        </CardContent>
      )}
    </Card>
  )
}
