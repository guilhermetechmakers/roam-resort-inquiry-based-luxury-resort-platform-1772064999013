import type { Listing } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface DestinationHeaderCardProps {
  destination: Listing
  image?: string
  description?: string
}

export function DestinationHeaderCard({
  destination,
  image,
  description,
}: DestinationHeaderCardProps) {
  const heroImage = image ?? destination.hero_image_url ?? destination.gallery_urls?.[0]
  const rawDesc =
    description ??
    destination.subtitle ??
    (typeof destination.editorial_content === 'string'
      ? destination.editorial_content.replace(/[#*_`]/g, '').slice(0, 200)
      : '')
  const desc = rawDesc ? `${rawDesc}${rawDesc.length >= 200 ? '…' : ''}` : ''
  const galleryUrls = destination.gallery_urls ?? []

  return (
    <Card
      className={cn(
        'overflow-hidden border-border bg-card shadow-card',
        'transition-all duration-300 hover:shadow-card-hover'
      )}
    >
      <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted">
        {heroImage ? (
          <img
            src={heroImage}
            alt={destination.title ?? 'Destination'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/30">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>
      <CardContent className="p-6 sm:p-8">
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {destination.region ?? 'Destination'}
            </p>
            <h1 className="font-serif text-2xl font-bold sm:text-3xl">{destination.title}</h1>
            {destination.subtitle && (
              <p className="mt-1 font-serif italic text-muted-foreground">{destination.subtitle}</p>
            )}
          </div>
          {desc && (
            <p className="max-w-2xl text-sm leading-relaxed text-foreground/90 line-clamp-3">
              {typeof desc === 'string' ? desc : ''}
            </p>
          )}
          {galleryUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(galleryUrls ?? []).slice(0, 5).map((url, i) => (
                <div
                  key={i}
                  className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border"
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
