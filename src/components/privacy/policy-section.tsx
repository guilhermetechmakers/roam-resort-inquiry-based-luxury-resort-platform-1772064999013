import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { PolicySection, PolicySubsection } from '@/types/privacy'

export interface PolicySectionProps {
  section: PolicySection
  className?: string
}

function SubsectionBlock({ subsection }: { subsection: PolicySubsection }) {
  const { id = '', title = '', content = '' } = subsection ?? {}
  return (
    <div id={id} className="mt-4">
      <h4 className="font-serif text-base font-semibold text-foreground">{title}</h4>
      <p className="mt-2 text-foreground/90 leading-relaxed">{content}</p>
    </div>
  )
}

export function PolicySectionComponent({ section, className }: PolicySectionProps) {
  const { id = '', title = '', content = '', subsections = [] } = section ?? {}
  const safeSubsections = Array.isArray(subsections) ? subsections : []

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
        <h2
          id={`${id}-heading`}
          className="font-serif text-xl font-semibold text-foreground"
        >
          {title}
        </h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {content ? (
          <p className="text-foreground/90 leading-relaxed">{content}</p>
        ) : null}
        {safeSubsections.length > 0 ? (
          <div className="space-y-2">
            {safeSubsections
              .filter((sub): sub is PolicySubsection => sub != null)
              .map((sub) => (
                <SubsectionBlock key={sub.id} subsection={sub} />
              ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
