/**
 * EditorialPreviewPanel — Editorial content snippet and image gallery overview.
 * Renders short textual summary and thumbnail grid; supports lightbox.
 */

import { useState, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EditorialNarrative } from '@/components/destination-detail/editorial-narrative'
import type { HostListingDetail, ImageItem } from '@/types/host-listing-detail'
import { cn } from '@/lib/utils'

export interface EditorialPreviewPanelProps {
  listing: HostListingDetail | null
  className?: string
}

/** Truncate editorial content to ~200 chars for snippet */
function getEditorialSnippet(content: string | null | undefined): string {
  if (!content?.trim()) return ''
  const plain = content.replace(/#{1,6}\s/g, '').replace(/\n/g, ' ').trim()
  return plain.length > 220 ? plain.slice(0, 220) + '…' : plain
}

export function EditorialPreviewPanel({
  listing,
  className,
}: EditorialPreviewPanelProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const editorialRaw =
    typeof listing?.editorial_content === 'string'
      ? listing.editorial_content
      : listing?.editorial_content_raw ?? ''

  const imageGallery = listing?.image_gallery ?? []
  const galleryUrlsRaw = Array.isArray(imageGallery)
    ? imageGallery
    : []
  const galleryUrls: string[] =
    galleryUrlsRaw.length > 0
      ? galleryUrlsRaw.map((item) =>
          typeof item === 'string' ? item : (item as ImageItem)?.url ?? ''
        ).filter(Boolean)
      : Array.isArray(listing?.gallery_urls)
        ? (listing.gallery_urls ?? [])
        : []

  const safeUrls: string[] = galleryUrls.length > 0 ? galleryUrls : []

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex === null) return
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight' && safeUrls.length > 1) {
        setLightboxIndex((i) => ((i ?? 0) + 1) % safeUrls.length)
      }
      if (e.key === 'ArrowLeft' && safeUrls.length > 1) {
        setLightboxIndex((i) =>
          ((i ?? 0) - 1 + safeUrls.length) % safeUrls.length
        )
      }
    },
    [lightboxIndex, safeUrls.length]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!listing) return null

  const snippet = getEditorialSnippet(editorialRaw)

  return (
    <section
      className={cn('rounded-xl border border-border bg-card p-6 shadow-card', className)}
      aria-labelledby="editorial-preview-heading"
    >
      <h2
        id="editorial-preview-heading"
        className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        Editorial Preview
      </h2>

      {snippet ? (
        <div className="prose prose-sm max-w-none prose-p:text-muted-foreground">
          <p className="leading-relaxed">{snippet}</p>
        </div>
      ) : editorialRaw ? (
        <div className="max-h-48 overflow-y-auto">
          <EditorialNarrative content={editorialRaw} />
        </div>
      ) : (
        <p className="text-sm italic text-muted-foreground">
          No editorial content yet.
        </p>
      )}

      {safeUrls.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Gallery
          </p>
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
            role="list"
          >
            {safeUrls.slice(0, 8).map((url: string, idx: number) => (
              <button
                key={`${url}-${idx}`}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted transition-all duration-300 hover:border-accent/50 hover:shadow-accent-glow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                aria-label={`View image ${idx + 1}`}
              >
                <img
                  src={url}
                  alt={`${listing.title ?? 'Listing'} image ${idx + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && safeUrls.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-12 w-12 rounded-full text-white hover:bg-white/20"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </Button>
          {safeUrls.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full text-white hover:bg-white/20"
                onClick={() =>
                  setLightboxIndex((i) => ((i ?? 0) - 1 + safeUrls.length) % safeUrls.length)
                }
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full text-white hover:bg-white/20"
                onClick={() =>
                  setLightboxIndex((i) => ((i ?? 0) + 1) % safeUrls.length)
                }
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}
          <img
            src={safeUrls[lightboxIndex] ?? safeUrls[0]}
            alt={`${listing.title ?? 'Listing'} full size`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {lightboxIndex + 1} / {safeUrls.length}
          </p>
        </div>
      )}
    </section>
  )
}
