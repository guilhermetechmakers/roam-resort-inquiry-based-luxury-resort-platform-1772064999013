/**
 * Bronze-gold CTA Export button.
 */

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ExportButtonProps {
  disabled?: boolean
  onClick: () => void
  isLoading?: boolean
  className?: string
}

export function ExportButton({
  disabled = false,
  onClick,
  isLoading = false,
  className,
}: ExportButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-label="Export CSV"
      className={cn(
        'bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98]',
        'shadow-md hover:shadow-accent-glow transition-all duration-200',
        className
      )}
    >
      {isLoading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" aria-hidden />
          Exporting…
        </>
      ) : (
        <>
          <Download className="h-5 w-5" aria-hidden />
          Export CSV
        </>
      )}
    </Button>
  )
}
