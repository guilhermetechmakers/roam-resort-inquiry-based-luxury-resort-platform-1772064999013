import { cn } from '@/lib/utils'

export interface BrandStoryBlockProps {
  paragraphs: string[]
  image?: string
  imageCaption?: string
  imagePosition?: 'left' | 'right'
  className?: string
}

export function BrandStoryBlock({
  paragraphs,
  image,
  imageCaption,
  imagePosition = 'right',
  className,
}: BrandStoryBlockProps) {
  const safeParagraphs = Array.isArray(paragraphs) ? paragraphs : []
  const paragraphItems = safeParagraphs.length > 0 ? safeParagraphs : []

  return (
    <section
      className={cn('py-16 sm:py-20', className)}
      aria-labelledby="brand-story-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'grid gap-12 lg:grid-cols-2 lg:gap-16',
            imagePosition === 'left' && 'lg:grid-flow-dense'
          )}
        >
          {image ? (
            <div
              className={cn(
                'relative overflow-hidden rounded-xl border border-border bg-secondary/30 shadow-card',
                imagePosition === 'left' && 'lg:col-start-1'
              )}
            >
              <div
                className="aspect-[4/3] bg-cover bg-center"
                style={{ backgroundImage: `url(${image})` }}
                role="img"
                aria-label={imageCaption ?? 'Roam Resort destination'}
              />
              {imageCaption ? (
                <p className="p-4 text-sm text-muted-foreground italic">
                  {imageCaption}
                </p>
              ) : null}
            </div>
          ) : null}
          <div
            className={cn(
              'flex flex-col justify-center',
              imagePosition === 'left' && 'lg:col-start-2'
            )}
          >
            <h2
              id="brand-story-heading"
              className="font-serif text-3xl font-semibold text-foreground sm:text-4xl"
            >
              Our Story
            </h2>
            <div className="mt-6 space-y-6">
              {paragraphItems.map((p, idx) => (
                <p
                  key={idx}
                  className="text-base leading-relaxed text-foreground/90 sm:text-lg"
                >
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
