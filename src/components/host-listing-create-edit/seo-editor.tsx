import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ListingMetadata } from '@/types/host-listing-create-edit'
import { META_TITLE_MAX, META_DESC_MAX } from '@/lib/validation/host-listing-schema'

const ROBOTS_OPTIONS = [
  { value: 'index, follow', label: 'Index, follow' },
  { value: 'noindex, follow', label: 'No index, follow' },
  { value: 'index, nofollow', label: 'Index, no follow' },
  { value: 'noindex, nofollow', label: 'No index, no follow' },
]

export interface SEOEditorProps {
  seo: ListingMetadata
  slug: string
  onSeoChange: (seo: ListingMetadata) => void
  onSlugChange: (slug: string) => void
  errors?: Record<string, string>
  titleHint?: string
  className?: string
}

function slugify(text: string): string {
  return (text ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function SEOEditor({
  seo,
  slug,
  onSeoChange,
  onSlugChange,
  errors = {},
  titleHint = '',
  className,
}: SEOEditorProps) {
  const handleSlugFromTitle = () => {
    const base = titleHint || seo.metaTitle || ''
    if (base) onSlugChange(slugify(base))
  }

  return (
    <Card className={cn('border-border shadow-card overflow-hidden', className)}>
      <CardHeader className="border-b border-border bg-secondary/20 px-8 py-6">
        <h2 className="font-serif text-xl font-semibold">SEO Metadata</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Optimize your listing for search engines. Meta title and description appear in search results.
        </p>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div>
          <Label htmlFor="slug" className="text-sm font-medium">
            URL Slug <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="slug"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="cliffside-retreat-santorini"
              className="flex-1 h-11 rounded-lg font-mono"
              aria-invalid={!!errors.slug}
            />
            <button
              type="button"
              onClick={handleSlugFromTitle}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-secondary hover:bg-secondary/80 transition-colors"
            >
              Generate from title
            </button>
          </div>
          {errors.slug && (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {errors.slug}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Lowercase, numbers, hyphens only. Used in /destinations/[slug]
          </p>
        </div>

        <div>
          <Label htmlFor="metaTitle" className="text-sm font-medium">
            Meta Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="metaTitle"
            value={seo.metaTitle ?? ''}
            onChange={(e) => onSeoChange({ ...seo, metaTitle: e.target.value })}
            placeholder="Cliffside Retreat | Santorini Luxury Villa"
            maxLength={META_TITLE_MAX}
            className="mt-2 h-11 rounded-lg"
            aria-invalid={!!errors['seo.metaTitle']}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {(seo.metaTitle ?? '').length} / {META_TITLE_MAX} characters
          </p>
          {errors['seo.metaTitle'] && (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {errors['seo.metaTitle']}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="metaDescription" className="text-sm font-medium">
            Meta Description <span className="text-destructive">*</span>
          </Label>
          <Input
            id="metaDescription"
            value={seo.metaDescription ?? ''}
            onChange={(e) =>
              onSeoChange({ ...seo, metaDescription: e.target.value })
            }
            placeholder="Perched on the caldera's edge, Cliffside Retreat offers..."
            maxLength={META_DESC_MAX}
            className="mt-2 h-11 rounded-lg"
            aria-invalid={!!errors['seo.metaDescription']}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {(seo.metaDescription ?? '').length} / {META_DESC_MAX} characters
          </p>
          {errors['seo.metaDescription'] && (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {errors['seo.metaDescription']}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="canonicalUrl" className="text-sm font-medium">
            Canonical URL
          </Label>
          <Input
            id="canonicalUrl"
            type="url"
            value={seo.canonicalUrl ?? ''}
            onChange={(e) =>
              onSeoChange({ ...seo, canonicalUrl: e.target.value })
            }
            placeholder="https://yoursite.com/destinations/cliffside-retreat"
            className="mt-2 h-11 rounded-lg"
          />
        </div>

        <div>
          <Label htmlFor="robots" className="text-sm font-medium">
            Robots
          </Label>
          <Select
            value={seo.robots ?? 'index, follow'}
            onValueChange={(v) => onSeoChange({ ...seo, robots: v })}
          >
            <SelectTrigger id="robots" className="mt-2 h-11 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROBOTS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="ogImage" className="text-sm font-medium">
            Open Graph Image URL
          </Label>
          <Input
            id="ogImage"
            type="url"
            value={seo.ogImage ?? ''}
            onChange={(e) =>
              onSeoChange({ ...seo, ogImage: e.target.value })
            }
            placeholder="https://example.com/og-image.jpg"
            className="mt-2 h-11 rounded-lg"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Image for social sharing. 1200×630 recommended.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
