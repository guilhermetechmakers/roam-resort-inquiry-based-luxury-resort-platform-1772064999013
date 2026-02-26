import { Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { GalleryItem } from '@/types/host-listing-create-edit'

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400'

export interface MediaCardProps {
  item: GalleryItem
  index: number
  totalCount: number
  onUpdate: (id: string, updates: Partial<GalleryItem>) => void
  onRemove: (id: string) => void
  onMoveUp?: (index: number) => void
  onMoveDown?: (index: number) => void
  disabled?: boolean
  error?: string
}

export function MediaCard({
  item,
  index,
  totalCount,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  disabled,
  error,
}: MediaCardProps) {
  return (
    <Card
      className={cn(
        'group overflow-hidden border-border transition-all duration-200',
        'hover:shadow-card-hover hover:border-accent/30'
      )}
    >
      <div className="relative aspect-[4/3] bg-muted">
        <img
          src={item.imageUrl || PLACEHOLDER_IMG}
          alt={item.altText || ''}
          className="h-full w-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = PLACEHOLDER_IMG
          }}
        />
        {!disabled && (
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex gap-1">
              {onMoveUp && index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => onMoveUp(index)}
                  aria-label="Move image up"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              )}
              {onMoveDown && index < totalCount - 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => onMoveDown(index)}
                  aria-label="Move image down"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={() => onRemove(item.id)}
              aria-label={`Remove image ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
          #{index + 1}
        </span>
      </div>
      <div className="p-3 space-y-2">
        <div>
          <Label htmlFor={`alt-${item.id}`} className="text-xs font-medium">
            Alt text <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`alt-${item.id}`}
            value={item.altText ?? ''}
            onChange={(e) => onUpdate(item.id, { altText: e.target.value })}
            placeholder="Describe the image for accessibility"
            className="mt-1 h-8 text-sm"
            disabled={disabled}
            aria-invalid={!!error}
          />
          {error && (
            <p className="mt-0.5 text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor={`caption-${item.id}`} className="text-xs font-medium">
            Caption
          </Label>
          <Input
            id={`caption-${item.id}`}
            value={item.caption ?? ''}
            onChange={(e) => onUpdate(item.id, { caption: e.target.value })}
            placeholder="Optional caption"
            className="mt-1 h-8 text-sm"
            disabled={disabled}
          />
        </div>
      </div>
    </Card>
  )
}
