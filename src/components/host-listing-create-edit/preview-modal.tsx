import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EditorialNarrative } from '@/components/destination-detail'
import { cn } from '@/lib/utils'
import type { HostListingFormData, GalleryItem } from '@/types/host-listing-create-edit'
import { ensureArray } from '@/lib/utils/array-utils'

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200'

export interface PreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: HostListingFormData
  listingId?: string
  className?: string
}

export function PreviewModal({
  open,
  onOpenChange,
  data,
  listingId,
  className,
}: PreviewModalProps) {
  const gallery = ensureArray<GalleryItem>(data.gallery).sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  )
  const heroUrl = gallery[0]?.imageUrl ?? PLACEHOLDER_IMG

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-4xl max-h-[90vh] overflow-y-auto p-0',
          className
        )}
        showClose
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-0">
          {/* Hero */}
          <div className="aspect-[21/9] min-h-[200px] bg-muted">
            <img
              src={heroUrl}
              alt={data.title ?? 'Listing'}
              className="h-full w-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = PLACEHOLDER_IMG
              }}
            />
          </div>

          <div className="p-6 space-y-6">
            <div>
              <span className="text-sm text-muted-foreground">
                {[data.locationCity, data.locationCountry].filter(Boolean).join(', ') || '—'}
              </span>
              <h2 className="font-serif text-2xl font-semibold mt-1">
                {data.title || 'Untitled'}
              </h2>
              {data.tagline && (
                <p className="text-muted-foreground mt-1">{data.tagline}</p>
              )}
            </div>

            {data.editorialContent && (
              <div className="rounded-lg border border-border p-6 bg-secondary/20">
                <EditorialNarrative content={data.editorialContent} />
              </div>
            )}

            {gallery.length > 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {gallery.slice(1, 7).map((item: GalleryItem, i: number) => (
                  <img
                    key={item.id}
                    src={item.imageUrl}
                    alt={item.altText || `Gallery image ${i + 2}`}
                    className="aspect-[4/3] object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {data.experience && (
              <div className="rounded-lg border border-border p-4">
                <h3 className="font-serif font-semibold mb-2">Experience</h3>
                <p className="text-sm text-muted-foreground">
                  Capacity: {data.experience.capacity ?? 4} guests
                  {data.experience.amenities?.length ? (
                    <> · {data.experience.amenities.join(', ')}</>
                  ) : null}
                </p>
              </div>
            )}

            {data.slug && listingId && (
              <Link
                to={`/destinations/${data.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent hover:underline"
              >
                View live page
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
