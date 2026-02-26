import { useCallback, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ImageUploadProps {
  images: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  disabled?: boolean
  error?: string
  className?: string
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400'

export function ImageUpload({
  images,
  onChange,
  maxImages = 10,
  disabled,
  error,
  className,
}: ImageUploadProps) {
  const items = Array.isArray(images) ? images : []
  const [dragOver, setDragOver] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)

  const addImage = useCallback(
    (url: string) => {
      const trimmed = url.trim()
      if (!trimmed) return
      if (items.length >= maxImages) {
        setInputError(`Maximum ${maxImages} images allowed`)
        return
      }
      setInputError(null)
      onChange([...items, trimmed])
    },
    [items, maxImages, onChange]
  )

  const removeImage = useCallback(
    (index: number) => {
      const next = items.filter((_, i) => i !== index)
      onChange(next)
      setInputError(null)
    },
    [items, onChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (disabled) return
      const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
      if (url?.startsWith('http')) addImage(url)
    },
    [addImage, disabled]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (disabled) return
      const url = e.clipboardData.getData('text')
      if (url?.startsWith('http')) {
        e.preventDefault()
        addImage(url)
      }
    },
    [addImage, disabled]
  )

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap gap-4">
        {items.map((url, i) => (
          <div
            key={url + i}
            className="relative group aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
          >
            <img
              src={url}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = PLACEHOLDER
              }}
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 rounded-full bg-destructive/90 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label={`Remove image ${i + 1}`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {items.length < maxImages && !disabled && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onPaste={handlePaste}
            className={cn(
              'flex aspect-[4/3] w-32 shrink-0 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30 transition-colors hover:border-accent/50 hover:bg-secondary/50',
              dragOver && 'border-accent bg-accent/10'
            )}
          >
            <Upload className="h-8 w-8 text-muted-foreground" aria-hidden />
            <span className="mt-1 text-xs text-muted-foreground">Add image</span>
          </div>
        )}
      </div>

      {/* URL input for adding images */}
      {!disabled && items.length < maxImages && (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Paste image URL"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addImage((e.target as HTMLInputElement).value)
                ;(e.target as HTMLInputElement).value = ''
              }
            }}
            onBlur={(e) => {
              const v = e.target.value.trim()
              if (v) {
                addImage(v)
                e.target.value = ''
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement
              if (input?.value) {
                addImage(input.value)
                input.value = ''
              }
            }}
          >
            Add
          </Button>
        </div>
      )}

      {(error || inputError) && (
        <p className="text-sm text-destructive">{error ?? inputError}</p>
      )}
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          At least 1 image is required for publishing.
        </p>
      )}
    </div>
  )
}
