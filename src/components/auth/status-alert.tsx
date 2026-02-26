import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatusAlertType = 'success' | 'error' | 'info'

export interface StatusAlertProps {
  type: StatusAlertType
  message: string
  className?: string
  id?: string
  'aria-live'?: 'polite' | 'assertive' | 'off'
}

const typeConfig: Record<
  StatusAlertType,
  { icon: typeof CheckCircle2; className: string }
> = {
  success: {
    icon: CheckCircle2,
    className:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  error: {
    icon: AlertCircle,
    className:
      'border-destructive/30 bg-destructive/10 text-destructive',
  },
  info: {
    icon: Info,
    className:
      'border-accent/30 bg-accent/10 text-accent-foreground',
  },
}

export function StatusAlert({
  type,
  message,
  className,
  id,
  'aria-live': ariaLive,
}: StatusAlertProps) {
  const config = typeConfig[type] ?? typeConfig.info
  const Icon = config.icon

  return (
    <div
      id={id}
      role="alert"
      aria-live={ariaLive ?? (type === 'error' ? 'assertive' : 'polite')}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 animate-fade-in',
        config.className,
        className
      )}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
      <p className="font-medium flex-1 min-w-0">{message}</p>
    </div>
  )
}
