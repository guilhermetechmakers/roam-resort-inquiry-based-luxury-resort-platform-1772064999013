import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface EmptyStateCardProps {
  message?: string
  submessage?: string
  cta?: React.ReactNode
  className?: string
}

/**
 * Editorial-friendly empty state aligning with Roam Resort visual style.
 */
export function EmptyStateCard({
  message = 'No inquiries yet',
  submessage = 'Your past inquiries and receipts will appear here. Start by exploring our destinations and submitting an inquiry.',
  cta,
  className,
}: EmptyStateCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/50">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h4 className="mt-6 font-serif text-xl font-semibold text-foreground">
        {message}
      </h4>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {submessage}
      </p>
      {cta && (
        <div className="mt-6">
          {typeof cta === 'string' ? (
            <Button asChild>
              <a href="/destinations">{cta}</a>
            </Button>
          ) : (
            cta
          )}
        </div>
      )}
    </div>
  )
}
