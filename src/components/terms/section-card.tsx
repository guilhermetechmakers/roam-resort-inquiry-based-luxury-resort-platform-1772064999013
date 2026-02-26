import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { TermsSection } from '@/types/terms'

export interface SectionCardProps {
  id: string
  title: string
  body: string
  bullets?: string[]
  disclaimer?: string
  listType?: 'ul' | 'ol'
  className?: string
}

export function SectionCard({
  id,
  title,
  body,
  bullets = [],
  disclaimer,
  listType = 'ul',
  className,
}: SectionCardProps) {
  const safeBullets = Array.isArray(bullets) ? bullets : []
  const ListTag = listType === 'ol' ? 'ol' : 'ul'

  return (
    <Card
      id={id}
      className={cn(
        'transition-all duration-300 hover:shadow-card-hover hover:border-accent/30',
        className
      )}
      aria-labelledby={`${id}-heading`}
    >
      <CardHeader className="pb-2">
        <h3
          id={`${id}-heading`}
          className="font-serif text-xl font-semibold text-foreground"
        >
          {title}
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-foreground/90 leading-relaxed">{body}</p>
        {safeBullets.length > 0 ? (
          <ListTag
            className={cn(
              'space-y-2 pl-6',
              listType === 'ol' ? 'list-decimal' : 'list-disc'
            )}
          >
            {safeBullets.map((item, idx) => (
              <li key={idx} className="text-foreground/90">
                {item}
              </li>
            ))}
          </ListTag>
        ) : null}
        {disclaimer ? (
          <p className="text-sm text-muted-foreground italic border-l-2 border-accent/40 pl-4">
            {disclaimer}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

/** Renders a SectionCard from a TermsSection object */
export function SectionCardFromSection(section: TermsSection) {
  const {
    id = '',
    title = '',
    body = '',
    bullets,
    disclaimer,
    listType = 'ul',
  } = section ?? {}
  return (
    <SectionCard
      key={id}
      id={id}
      title={title}
      body={body}
      bullets={bullets}
      disclaimer={disclaimer}
      listType={listType}
    />
  )
}
