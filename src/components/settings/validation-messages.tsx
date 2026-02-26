import { cn } from '@/lib/utils'

export interface ValidationMessagesProps {
  type?: 'error' | 'success'
  message?: string
  error?: string
  messages?: string[]
  id?: string
  className?: string
}

/** Reusable validation UI with ARIA attributes */
export function ValidationMessages({
  type = 'error',
  message,
  error,
  messages,
  id,
  className,
}: ValidationMessagesProps) {
  const list = (message ?? error) ? [message ?? error ?? ''] : (messages ?? [])
  if (list.length === 0) return null

  const isError = type === 'error'
  const role = isError ? 'alert' : 'status'
  const ariaLive = isError ? 'assertive' : 'polite'

  return (
    <div
      id={id}
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      className={cn(
        'mt-2 space-y-1 text-sm',
        isError ? 'text-destructive' : 'text-green-600 dark:text-green-400',
        className
      )}
    >
      {list.map((msg, i) => (
        <p key={i}>{msg}</p>
      ))}
    </div>
  )
}
