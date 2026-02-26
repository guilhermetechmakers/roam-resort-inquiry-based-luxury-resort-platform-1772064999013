/**
 * MediaGalleryEditor - listing/profile/editorial gallery with add/remove/reorder.
 */

import { useCallback, useState } from 'react'
import { GripVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AssetPreview } from './asset-preview'
import { CloudinaryUploader } from './cloudinary-uploader'
import { cn } from '@/lib/utils'
import type { MediaAsset } from '@/types/media'
import type { MediaAssetType, MediaOwnerType } from '@/types/media'

export interface MediaGalleryEditorProps {
  assets: MediaAsset[]
  entityType: MediaOwnerType
  entityId: string
  assetType: MediaAssetType
  onAssetsChange?: (assets: MediaAsset[]) => void
  onReorder?: (assetIds: string[]) => void
  onDelete?: (id: string) => void
  onUpdate?: (id: string, updates: Partial<Pick<MediaAsset, 'alt_text' | 'caption'>>) => void
  maxItems?: number
  disabled?: boolean
  className?: string
}

export function MediaGalleryEditor({
  assets,
  entityType,
  entityId,
  assetType,
  onAssetsChange,
  onReorder,
  onDelete,
  onUpdate,
  maxItems = 20,
  disabled,
  className,
}: MediaGalleryEditorProps) {
  const items = Array.isArray(assets) ? assets : []
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleUploadSuccess = useCallback(
    (asset: { id: string; secure_url: string; public_id: string }) => {
      const newAsset: MediaAsset = {
        id: asset.id,
        public_id: asset.public_id,
        secure_url: asset.secure_url,
        width: 0,
        height: 0,
        format: 'image',
        bytes: 0,
        resource_type: 'image',
        type: assetType,
        owner_type: entityType,
        owner_id: entityId,
        caption: null,
        alt_text: null,
        focal_point_x: null,
        focal_point_y: null,
        transformations: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      onAssetsChange?.([...items, newAsset])
    },
    [assetType, entityType, entityId, items, onAssetsChange]
  )

  const handleRemove = useCallback(
    (id: string) => {
      onDelete?.(id)
      onAssetsChange?.(items.filter((a) => a.id !== id))
    },
    [items, onDelete, onAssetsChange]
  )

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex == null) return
    if (draggedIndex === index) return
    const next = [...items]
    const [removed] = next.splice(draggedIndex, 1)
    next.splice(index, 0, removed)
    onAssetsChange?.(next)
    onReorder?.(next.map((a) => a.id))
    setDraggedIndex(index)
  }, [draggedIndex, items, onAssetsChange, onReorder])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
  }, [])

  return (
    <Card className={cn('border-border shadow-card overflow-hidden', className)}>
      <CardHeader className="border-b border-border bg-secondary/20 px-8 py-6">
        <h2 className="font-serif text-xl font-semibold">Media Gallery</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add images with alt text and captions. Drag to reorder.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {items.length} / {maxItems} images
        </p>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((asset, index) => (
            <div
              key={asset.id}
              draggable={!disabled}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'group rounded-xl border border-border transition-all duration-200',
                'hover:shadow-card-hover hover:border-accent/30',
                draggedIndex === index && 'opacity-50'
              )}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-muted">
                <AssetPreview
                  asset={asset}
                  preset="gallery_thumb"
                  sizes="gallery"
                  className="h-full w-full"
                />
                {!disabled && (
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-b from-black/50 to-transparent">
                    <div
                      className="cursor-grab touch-none rounded p-1 text-white hover:bg-white/20"
                      aria-label="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemove(asset.id)}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2 p-3">
                <div>
                  <Label htmlFor={`alt-${asset.id}`} className="text-xs font-medium">
                    Alt text
                  </Label>
                  <Input
                    id={`alt-${asset.id}`}
                    value={asset.alt_text ?? ''}
                    onChange={(e) => onUpdate?.(asset.id, { alt_text: e.target.value })}
                    placeholder="Describe for accessibility"
                    className="mt-1 h-8 text-sm"
                    disabled={disabled}
                  />
                </div>
                <div>
                  <Label htmlFor={`caption-${asset.id}`} className="text-xs font-medium">
                    Caption
                  </Label>
                  <Input
                    id={`caption-${asset.id}`}
                    value={asset.caption ?? ''}
                    onChange={(e) => onUpdate?.(asset.id, { caption: e.target.value })}
                    placeholder="Optional caption"
                    className="mt-1 h-8 text-sm"
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          ))}

          {items.length < maxItems && !disabled && (
            <CloudinaryUploader
              type={assetType}
              ownerType={entityType}
              ownerId={entityId}
              onSuccess={handleUploadSuccess}
              aspectRatioPreset="gallery"
              className="aspect-[4/3]"
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
