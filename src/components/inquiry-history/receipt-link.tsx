import { FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ReceiptLinkProps {
  url: string
  label?: string
  className?: string
  variant?: 'link' | 'button'
}

/**
 * Accessible link/button that opens receipt in new tab.
 * Renders only when url is valid.
 */
export function ReceiptLink({
  url,
  label = 'View receipt',
  className,
  variant = 'link',
}: ReceiptLinkProps) {
  if (!url || typeof url !== 'string') return null

  const href = url.startsWith('http') ? url : `https://${url}`

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        asChild
        className={cn('shrink-0', className)}
      >
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label} (opens in new tab)`}
        >
          <FileText className="mr-2 h-4 w-4" />
          {label}
        </a>
      </Button>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1.5 text-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded',
        className
      )}
      aria-label={`${label} (opens in new tab)`}
    >
      <FileText className="h-4 w-4 shrink-0" />
      {label}
      <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
    </a>
  )
}
