import { Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PdfDownloadButtonProps {
  pdfUrl?: string | null
  label?: string
  className?: string
}

export function PdfDownloadButton({
  pdfUrl,
  label,
  className,
}: PdfDownloadButtonProps) {
  const hasValidUrl =
    typeof pdfUrl === 'string' && pdfUrl.trim().length > 0
  const safeUrl = hasValidUrl ? pdfUrl!.trim() : ''
  const isExternal = safeUrl.startsWith('http')

  if (hasValidUrl) {
    return (
      <Button
        asChild
        className={cn(
          'gap-2 bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-200 hover:scale-[1.02] focus-visible:ring-accent',
          className
        )}
        aria-label={label ?? 'Download Privacy Policy as PDF'}
      >
        <a
          href={safeUrl}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          download={!isExternal}
        >
          <Download className="h-4 w-4" aria-hidden />
          {label ?? 'Download PDF'}
        </a>
      </Button>
    )
  }

  return (
    <Button
      type="button"
      className={cn(
        'gap-2 bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-200 hover:scale-[1.02] focus-visible:ring-accent',
        className
      )}
      onClick={() => window.print()}
      aria-label={label ?? 'Print or save Privacy Policy as PDF'}
    >
      <Printer className="h-4 w-4" aria-hidden />
      {label ?? 'Print / Save as PDF'}
    </Button>
  )
}
