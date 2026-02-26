import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface EmptyStateCardProps {
  message?: string
  cta?: { label: string; href?: string; to?: string; onClick?: () => void }
  className?: string
}

export function EmptyStateCard({
  message = 'Your past inquiries and receipts will appear here. Start by exploring our destinations and submitting an inquiry.',
  cta,
  className,
}: EmptyStateCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 rounded-xl border border-border bg-card/50',
        className
      )}
      role="status"
      aria-label="No inquiries"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
        <FileText className="h-8 w-8 text-accent" aria-hidden />
      </div>
      <h4 className="mt-6 font-serif text-xl font-semibold text-foreground">
        No inquiries yet
      </h4>
      <p className="mt-2 text-center text-muted-foreground max-w-md">
        {message}
      </p>
      {cta && (
        <div className="mt-6">
          {cta.to ? (
            <Button asChild>
              <Link to={cta.to}>{cta.label}</Link>
            </Button>
          ) : cta.href ? (
            <Button asChild>
              <a href={cta.href}>{cta.label}</a>
            </Button>
          ) : (
            <Button onClick={cta.onClick}>{cta.label}</Button>
          )}
        </div>
      )}
    </div>
  )
}
