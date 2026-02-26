import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { EditorialNarrative } from '@/components/destination-detail'

export interface PreviewPanelProps {
  title?: string
  subtitle?: string
  region?: string
  style?: string
  narrative?: string
  galleryUrls?: string[]
  className?: string
}

export function PreviewPanel({
  title = 'Untitled',
  subtitle,
  region,
  style,
  narrative,
  galleryUrls = [],
  className,
}: PreviewPanelProps) {
  const images = Array.isArray(galleryUrls) ? galleryUrls : []
  const firstImage = images[0]

  return (
    <Card className={cn('border-border shadow-card overflow-hidden', className)}>
      <CardHeader>
        <h3 className="font-serif text-lg font-semibold">Preview</h3>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <div className="aspect-[21/9] min-h-[160px] bg-muted">
          {firstImage ? (
            <img src={firstImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <div className="space-y-2 px-6 pb-6">
          <span className="text-sm text-muted-foreground">
            {[region, style].filter(Boolean).join(' · ') || '—'}
          </span>
          <h4 className="font-serif text-xl font-semibold">{title}</h4>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {narrative && (
            <div className="mt-4 max-h-48 overflow-y-auto rounded-lg border border-border p-4">
              <EditorialNarrative content={narrative} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
