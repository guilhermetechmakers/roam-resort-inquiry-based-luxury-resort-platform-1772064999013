import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { cloudinaryThumbUrl, isCloudinaryUrl } from '@/lib/cloudinary'
import type { Destination } from '@/types'

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800'

function getDetailUrl(destination: Destination): string {
  const slug = destination.slug ?? destination.id
  return `/destinations/${slug}`
}

function getOptimizedImageUrl(url: string): string {
  if (!url) return PLACEHOLDER_IMAGE
  return isCloudinaryUrl(url) ? cloudinaryThumbUrl(url) : url
}

export interface DestinationCardProps {
  destination: Destination
  className?: string
}

export function DestinationCard({ destination, className }: DestinationCardProps) {
  const href = getDetailUrl(destination)
  const rawUrl = destination.imageUrl ?? PLACEHOLDER_IMAGE
  const imageUrl = getOptimizedImageUrl(rawUrl)
  const title = destination.title ?? 'Untitled Destination'
  const tagline = destination.tagline ?? destination.excerpt ?? ''
  const region = destination.region ?? ''
  const style = destination.style ?? ''
  const hasTags = Boolean(region || style)

  return (
    <Card
      className={cn(
        'group overflow-hidden border-border transition-all duration-300',
        'hover:shadow-card-hover hover:border-accent/40 hover:scale-[1.02]',
        'focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2',
        className
      )}
    >
      <Link to={href} className="block focus:outline-none">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={title ? `${title} - ${region || style || 'Destination'}` : 'Destination image'}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-60" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-primary-foreground">
            <h3 className="font-serif text-xl font-semibold leading-tight">
              {title}
            </h3>
            {hasTags && (
              <span className="mt-1 block text-sm text-primary-foreground/90">
                {[region, style].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
        </div>
        <CardContent className="p-6">
          {tagline && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {tagline}
            </p>
          )}
          <span className="mt-4 inline-flex items-center text-accent font-medium hover:text-accent/90 transition-colors">
            View Destination
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </CardContent>
      </Link>
    </Card>
  )
}

export { getDetailUrl }
