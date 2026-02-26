import { FileText, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface ReceiptLinkCardProps {
  receiptUrl?: string | null
  inquiryReference?: string
  className?: string
}

export function ReceiptLinkCard({
  receiptUrl,
  inquiryReference,
  className,
}: ReceiptLinkCardProps) {
  if (!receiptUrl) return null

  return (
    <Card
      className={cn(
        'transition-all duration-300 hover:border-accent/40 hover:shadow-card-hover',
        className
      )}
    >
      <CardContent className="p-4">
        <a
          href={receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <FileText className="h-5 w-5 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">View receipt</p>
            {inquiryReference && (
              <p className="text-sm text-muted-foreground">
                {inquiryReference}
              </p>
            )}
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
        </a>
      </CardContent>
    </Card>
  )
}
