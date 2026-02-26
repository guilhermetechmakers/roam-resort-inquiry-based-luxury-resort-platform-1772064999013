import { useCallback, useState, useRef } from 'react'
import { Upload, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { MediaCard } from './media-card'
import type { GalleryItem } from '@/types/host-listing-create-edit'
import { uploadListingImage, addImageByUrl } from '@/api/host-listing-create-edit'
import { ensureArray } from '@/lib/utils/array-utils'
import { GALLERY_MIN, GALLERY_MAX } from '@/lib/validation/host-listing-schema'

export interface GalleryUploaderProps {
  gallery: GalleryItem[]
  onChange: (gallery: GalleryItem[]) => void
  listingId?: string
  errors?: Record<string, string>
  disabled?: boolean
  className?: string
}

function generateId(): string {
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function GalleryUploader({
  gallery,
  onChange,
  listingId,
  errors = {},
  disabled,
  className,
}: GalleryUploaderProps) {
  const items = ensureArray<GalleryItem>(gallery)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addItem = useCallback(
    (imageUrl: string, caption = '', altText = '') => {
      if (items.length >= GALLERY_MAX) {
        setInputError(`Maximum ${GALLERY_MAX} images allowed`)
        return
      }
      setInputError(null)
      const newItem: GalleryItem = {
        id: generateId(),
        imageUrl,
        caption,
        altText: altText || 'Image',
        sortOrder: items.length,
      }
      onChange([...items, newItem])
    },
    [items, onChange]
  )

  const updateItem = useCallback(
    (id: string, updates: Partial<GalleryItem>) => {
      const next = items.map((i: GalleryItem) =>
        i.id === id ? { ...i, ...updates } : i
      )
      onChange(next)
    },
    [items, onChange]
  )

  const removeItem = useCallback(
    (id: string) => {
      const next = items
        .filter((i: GalleryItem) => i.id !== id)
        .map((item: GalleryItem, idx: number) => ({ ...item, sortOrder: idx }))
      onChange(next)
    },
    [items, onChange]
  )

  const reorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return
      const reordered = [...items].sort((a: GalleryItem, b: GalleryItem) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      const [removed] = reordered.splice(fromIndex, 1)
      reordered.splice(toIndex, 0, removed)
      const withOrder = reordered.map((item: GalleryItem, idx: number) => ({ ...item, sortOrder: idx }))
      onChange(withOrder)
    },
    [items, onChange]
  )

  const moveUp = useCallback(
    (index: number) => {
      if (index <= 0) return
      reorder(index, index - 1)
    },
    [reorder]
  )

  const moveDown = useCallback(
    (index: number) => {
      if (index >= items.length - 1) return
      reorder(index, index + 1)
    },
    [reorder, items.length]
  )

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || disabled) return
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (items.length >= GALLERY_MAX) break
        setUploadProgress(`Uploading ${file.name}...`)
        try {
          const { url } = await uploadListingImage(file, listingId)
          addItem(url)
        } catch (err) {
          setInputError((err as Error).message ?? 'Upload failed')
        }
      }
      setUploadProgress(null)
    },
    [addItem, disabled, items.length, listingId]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (disabled) return
      const files = e.dataTransfer.files
      if (files?.length) {
        handleFileSelect(files)
      } else {
        const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
        if (url?.startsWith('http')) addItem(url)
      }
    },
    [disabled, handleFileSelect, addItem]
  )

  const handleUrlAdd = useCallback(() => {
    try {
      const { url } = addImageByUrl(urlInput)
      addItem(url)
      setUrlInput('')
      setInputError(null)
    } catch (err) {
      setInputError((err as Error).message ?? 'Invalid URL')
    }
  }, [urlInput, addItem])

  return (
    <Card className={cn('border-border shadow-card overflow-hidden', className)}>
      <CardHeader className="border-b border-border bg-secondary/20 px-8 py-6">
        <h2 className="font-serif text-xl font-semibold">Image Gallery</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add 3–20 images. JPEG, PNG, or WebP. Min 1200×800 recommended. Alt text required for accessibility.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {items.length} / {GALLERY_MAX} images
          {items.length < GALLERY_MIN && ` · At least ${GALLERY_MIN} required for publishing`}
        </p>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {/* Reorderable grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {([...items] as GalleryItem[])
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((item: GalleryItem, index: number) => (
              <MediaCard
                key={item.id}
                item={item}
                index={index}
                totalCount={items.length}
                onUpdate={updateItem}
                onRemove={removeItem}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
                disabled={disabled}
                error={errors[item.id]}
              />
            ))}

          {/* Drop zone */}
          {items.length < GALLERY_MAX && !disabled && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex aspect-[4/3] flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
                'hover:border-accent/50 hover:bg-accent/5',
                dragOver ? 'border-accent bg-accent/10' : 'border-border bg-secondary/30'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <Upload className="h-10 w-10 text-muted-foreground" aria-hidden />
              <span className="mt-2 text-sm font-medium text-muted-foreground">
                Drop images or click to upload
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, WebP · Max 5MB
              </span>
            </div>
          )}
        </div>

        {/* URL fallback */}
        {!disabled && items.length < GALLERY_MAX && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="gallery-url" className="text-sm font-medium">
                Or add by URL
              </Label>
              <Input
                id="gallery-url"
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value)
                  setInputError(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlAdd())}
                placeholder="https://example.com/image.jpg"
                className="mt-2"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleUrlAdd}
              disabled={!urlInput.trim()}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Add URL
            </Button>
          </div>
        )}

        {(inputError || errors.gallery || uploadProgress) && (
          <div className="space-y-1" role="alert" aria-live="polite">
            {uploadProgress && (
              <p className="text-sm text-muted-foreground">{uploadProgress}</p>
            )}
            {(inputError || errors.gallery) && (
              <p className="text-sm text-destructive">{inputError ?? errors.gallery}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
