/**
 * ContentCard - Design system compliant card for suggested navigation.
 * Image top, bold title, supporting text and actions below.
 * Used for editorial suggestions on 404 page.
 */
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface ContentCardProps {
  /** Card title */
  title: string
  /** Supporting body text */
  body?: string
  /** Optional image URL for top of card */
  imageUrl?: string
  /** Link destination */
  to: string
  /** Optional className */
  className?: string
}

export function ContentCard({
  title,
  body,
  imageUrl,
  to,
  className,
}: ContentCardProps) {
  const safeTitle = title ?? ''
  const safeBody = body ?? ''
  const safeImageUrl = imageUrl ?? ''

  return (
    <Link to={to} className="block group">
      <Card
        className={cn(
          'overflow-hidden border-secondary/60 bg-card shadow-card transition-all duration-300',
          'hover:shadow-card-hover hover:scale-[1.02] hover:border-accent/50',
          'focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2',
          className
        )}
      >
        {safeImageUrl && (
          <div
            className="aspect-[4/3] bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${safeImageUrl})` }}
            aria-hidden
          />
        )}
        <CardContent className="p-6">
          <h3 className="font-serif text-xl font-semibold text-foreground group-hover:text-accent transition-colors">
            {safeTitle}
          </h3>
          {safeBody && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {safeBody}
            </p>
          )}
          <span className="mt-3 inline-flex items-center text-sm font-medium text-accent">
            Explore
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}
