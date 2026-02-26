import { cn } from '@/lib/utils'

export interface EditorialNarrativeProps {
  content: string
  className?: string
}

/** Parses markdown-like editorial content into sections, headings, blockquotes */
function parseEditorialContent(content: string): React.ReactNode[] {
  if (!content?.trim()) return []

  const blocks = content.split(/\n\n+/)
  const nodes: React.ReactNode[] = []

  blocks.forEach((block, i) => {
    const trimmed = block.trim()
    if (!trimmed) return

    if (trimmed.startsWith('## ')) {
      nodes.push(
        <h2
          key={i}
          className="mt-10 font-serif text-2xl font-semibold text-foreground first:mt-0"
        >
          {trimmed.slice(3)}
        </h2>
      )
      return
    }

    if (trimmed.startsWith('### ')) {
      nodes.push(
        <h3
          key={i}
          className="mt-8 font-serif text-xl font-semibold text-foreground"
        >
          {trimmed.slice(4)}
        </h3>
      )
      return
    }

    if (trimmed.startsWith('> ')) {
      const rest = trimmed.slice(2)
      const dashIdx = rest.indexOf(' — ')
      const quoteText = dashIdx >= 0 ? rest.slice(0, dashIdx).trim() : rest
      const attribution = dashIdx >= 0 ? rest.slice(dashIdx + 3).trim() : undefined
      nodes.push(
        <blockquote
          key={i}
          className={cn(
            'my-8 border-l-4 border-accent pl-6 py-2',
            'font-serif text-lg italic text-foreground/90',
            'bg-secondary/30 rounded-r-lg'
          )}
        >
          <p>"{quoteText}"</p>
          {attribution && (
            <cite className="mt-2 block text-sm not-italic text-muted-foreground">
              — {attribution}
            </cite>
          )}
        </blockquote>
      )
      return
    }

    nodes.push(
      <p
        key={i}
        className="mt-4 text-muted-foreground leading-relaxed text-[15px]"
      >
        {trimmed}
      </p>
    )
  })

  return nodes
}

export function EditorialNarrative({ content, className }: EditorialNarrativeProps) {
  const nodes = parseEditorialContent(content ?? '')

  if (nodes.length === 0) {
    return null
  }

  return (
    <article
      className={cn(
        'prose prose-lg max-w-none',
        'prose-headings:font-serif prose-headings:text-foreground',
        'prose-p:text-muted-foreground prose-p:leading-relaxed',
        className
      )}
    >
      {nodes}
    </article>
  )
}
