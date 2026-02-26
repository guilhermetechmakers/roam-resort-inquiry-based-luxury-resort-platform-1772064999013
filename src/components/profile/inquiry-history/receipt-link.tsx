import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ReceiptLinkProps {
  url: string
  label?: string
  className?: string
}

export function ReceiptLink({ url, label = 'View receipt', className }: ReceiptLinkProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/90 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-2 py-1 transition-all duration-200',
        className
      )}
      aria-label={`${label} (opens in new tab)`}
    >
      <FileText className="h-4 w-4 shrink-0" />
      {label}
    </a>
  )
}
