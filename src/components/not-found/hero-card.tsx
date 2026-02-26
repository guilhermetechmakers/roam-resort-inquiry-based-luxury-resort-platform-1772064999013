import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface HeroCardProps {
  title: string
  body?: string
  href: string
  imageUrl?: string | null
  className?: string
}

export function HeroCard({
  title,
  body,
  href,
  imageUrl,
  className,
}: HeroCardProps) {
  const safeTitle = title ?? ''
  const safeBody = body ?? ''
  const safeHref = href ?? '/'

  return (
    <Link
      to={safeHref}
      className={cn(
        'block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-xl',
        className
      )}
      aria-label={`${safeTitle}${safeBody ? ` - ${safeBody}` : ''}`}
    >
      <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] hover:border-accent/50">
        {imageUrl && (
          <div className="aspect-[16/10] overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
        <CardContent className="p-6">
          <h3 className="font-serif text-xl font-semibold text-foreground group-hover:text-accent transition-colors">
            {safeTitle}
          </h3>
          {safeBody && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{safeBody}</p>
          )}
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent group-hover:gap-2 transition-all">
            Explore
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}
