import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { EditorialBlock } from '@/types'

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'

interface EditorialSidebarBlockProps {
  editorial?: EditorialBlock | null
  className?: string
}

export function EditorialSidebarBlock({
  editorial,
  className,
}: EditorialSidebarBlockProps) {
  if (!editorial?.id) return null

  const title = editorial.title ?? 'Featured Story'
  const teaser = editorial.teaser ?? ''
  const imageUrl = editorial.imageUrl ?? PLACEHOLDER_IMAGE
  const link = editorial.link ?? '/destinations'

  return (
    <aside
      className={cn(
        'rounded-xl border border-border bg-card overflow-hidden shadow-card',
        'transition-all duration-300 hover:shadow-card-hover',
        className
      )}
      aria-label="Featured editorial"
    >
      <div
        className="h-40 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
        role="img"
        aria-label={title}
      />
      <div className="p-6">
        <span className="text-xs font-medium uppercase tracking-wider text-accent">
          Editor&apos;s Pick
        </span>
        <h3 className="mt-2 font-serif text-xl font-semibold text-foreground">
          {title}
        </h3>
        {teaser && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
            {teaser}
          </p>
        )}
        <Link to={link} className="mt-4 block">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-accent/50 text-accent hover:bg-accent/10"
          >
            Read Story
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </aside>
  )
}
