import { useState, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface HeroGalleryImage {
  url: string
  altText?: string
}

export interface HeroGalleryProps {
  images: HeroGalleryImage[]
  title?: string
  region?: string
  style?: string
  className?: string
}

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200'

export function HeroGallery({
  images,
  title,
  region,
  style,
  className,
}: HeroGalleryProps) {
  const items = Array.isArray(images) ? images : []
  const safeImages =
    items.length > 0
      ? items.map((img) => ({
          url: img?.url ?? PLACEHOLDER_IMAGE,
          altText: img?.altText ?? title ?? 'Destination image',
        }))
      : [{ url: PLACEHOLDER_IMAGE, altText: title ?? 'Destination' }]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % safeImages.length)
  }, [safeImages.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length)
  }, [safeImages.length])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    },
    [lightboxOpen, goNext, goPrev]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const currentImage = safeImages[currentIndex] ?? safeImages[0]
  const hasTags = Boolean(region || style)

  return (
    <>
      <section
        className={cn('relative h-[70vh] min-h-[400px] overflow-hidden', className)}
        aria-label="Destination gallery"
      >
        {/* Main image slider */}
        <div className="relative h-full w-full">
          {safeImages.map((img, idx) => (
            <div
              key={`${img.url}-${idx}`}
              className={cn(
                'absolute inset-0 bg-cover bg-center transition-opacity duration-500',
                idx === currentIndex ? 'opacity-100 z-0' : 'opacity-0 z-0'
              )}
              style={{ backgroundImage: `url(${img.url})` }}
              role="img"
              aria-label={img.altText}
            />
          ))}
          <div className="absolute inset-0 gradient-hero z-10" />

          {/* Caption overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-6 sm:p-8 text-primary-foreground">
            <div className="mx-auto max-w-4xl">
              {hasTags && (
                <span className="text-sm font-medium text-secondary">
                  {[region, style].filter(Boolean).join(' · ')}
                </span>
              )}
              {title && (
                <h1 className="mt-2 font-serif text-4xl font-bold sm:text-5xl md:text-6xl">
                  {title}
                </h1>
              )}
              {safeImages.length > 1 && (
                <p className="mt-2 text-sm text-primary-foreground/80">
                  {currentIndex + 1} / {safeImages.length}
                </p>
              )}
            </div>
          </div>

          {/* Navigation arrows */}
          {safeImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 z-20 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 text-white hover:bg-black/50 hover:scale-105 transition-all"
                onClick={goPrev}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 z-20 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 text-white hover:bg-black/50 hover:scale-105 transition-all"
                onClick={goNext}
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Thumbnail dots */}
          {safeImages.length > 1 && (
            <div
              className="absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 gap-2"
              role="tablist"
              aria-label="Gallery thumbnails"
            >
              {safeImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={idx === currentIndex}
                  aria-label={`View image ${idx + 1}`}
                  className={cn(
                    'h-2 w-2 rounded-full transition-all duration-300',
                    idx === currentIndex
                      ? 'bg-accent w-6'
                      : 'bg-white/50 hover:bg-white/80'
                  )}
                  onClick={() => setCurrentIndex(idx)}
                />
              ))}
            </div>
          )}

          {/* Expand / Lightbox trigger */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 bottom-24 z-20 text-white/90 hover:text-white hover:bg-white/20"
            onClick={() => setLightboxOpen(true)}
            aria-label="Open lightbox"
          >
            Expand
          </Button>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && (
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
            onClick={() => setLightboxOpen(false)}
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </Button>
          {safeImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full text-white hover:bg-white/20"
                onClick={goPrev}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full text-white hover:bg-white/20"
                onClick={goNext}
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}
          <img
            src={currentImage.url}
            alt={currentImage.altText}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {currentIndex + 1} / {safeImages.length}
          </p>
        </div>
      )}
    </>
  )
}
