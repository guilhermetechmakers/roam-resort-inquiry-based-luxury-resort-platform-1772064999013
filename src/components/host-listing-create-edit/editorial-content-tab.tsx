import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { HostListingFormData } from '@/types/host-listing-create-edit'
import { EDITORIAL_MIN_WORDS } from '@/lib/validation/host-listing-schema'

function countWords(text: string): number {
  return (text?.trim() ?? '').split(/\s+/).filter(Boolean).length
}

export interface EditorialContentTabProps {
  data: HostListingFormData
  onChange: (updates: Partial<HostListingFormData>) => void
  errors?: Record<string, string>
  className?: string
}

export function EditorialContentTab({
  data,
  onChange,
  errors = {},
  className,
}: EditorialContentTabProps) {
  const content = data.editorialContent ?? ''
  const wordCount = countWords(content)
  const meetsMin = wordCount >= EDITORIAL_MIN_WORDS

  return (
    <Card className={cn('border-border shadow-card overflow-hidden', className)}>
      <CardHeader className="border-b border-border bg-secondary/20 px-8 py-6">
        <h2 className="font-serif text-xl font-semibold">Editorial Content</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tell the story of your destination. Use Markdown for headings (##), pull quotes (&gt;), and lists.
        </p>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-4">
          <div>
            <Label htmlFor="editorialContent" className="text-sm font-medium">
              Overview & Narrative <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="editorialContent"
              value={content}
              onChange={(e) => onChange({ editorialContent: e.target.value })}
              placeholder="## Where the Aegean Meets the Sky

Perched on the caldera's edge, your retreat offers an intimate escape...

> A place where time slows and the horizon stretches forever.

## The Experience

Our concierge team curates every detail..."
              rows={14}
              className={cn(
                'mt-2 rounded-lg border-border font-mono text-sm resize-y min-h-[280px]',
                'focus:ring-2 focus:ring-accent/30 transition-shadow duration-200',
                errors.editorialContent && 'border-destructive'
              )}
              aria-invalid={!!errors.editorialContent}
              aria-describedby="editorial-help editorial-wordcount"
            />
            <div className="mt-2 flex items-center justify-between">
              <p
                id="editorial-wordcount"
                className={cn(
                  'text-sm',
                  meetsMin ? 'text-muted-foreground' : 'text-destructive'
                )}
              >
                {wordCount} words
                {!meetsMin && ` (minimum ${EDITORIAL_MIN_WORDS} required for publishing)`}
              </p>
              {errors.editorialContent && (
                <p id="editorial-error" className="text-sm text-destructive" role="alert">
                  {errors.editorialContent}
                </p>
              )}
            </div>
            <p id="editorial-help" className="mt-1 text-xs text-muted-foreground">
              Use ## for headings, &gt; for pull quotes, **bold** and *italic* for emphasis.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
