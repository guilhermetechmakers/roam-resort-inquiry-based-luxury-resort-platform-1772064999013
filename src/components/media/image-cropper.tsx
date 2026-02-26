/**
 * ImageCropper - client-side cropping with aspect ratio presets.
 * Outputs crop geometry and cropped blob for upload.
 */

import { useCallback, useEffect, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ASPECT_RATIO_PRESETS } from '@/types/media'

export interface CropGeometry {
  x: number
  y: number
  width: number
  height: number
  aspectRatio?: number
}

export interface ImageCropperProps {
  image: string | Blob
  open: boolean
  onOpenChange: (open: boolean) => void
  onCropComplete: (blob: Blob, geometry: CropGeometry) => void
  aspectRatioPreset?: keyof typeof ASPECT_RATIO_PRESETS
  altText?: string
  caption?: string
}

const PRESET_LABELS: Record<keyof typeof ASPECT_RATIO_PRESETS, string> = {
  listing_hero: 'Hero (16:9)',
  gallery: 'Gallery (4:3)',
  avatar: 'Avatar (1:1)',
  editorial_banner: 'Banner (1600×420)',
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Crop failed'))),
      'image/jpeg',
      0.9
    )
  })
}

export function ImageCropper({
  image,
  open,
  onOpenChange,
  onCropComplete,
  aspectRatioPreset = 'gallery',
}: ImageCropperProps) {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activePreset, setActivePreset] = useState<keyof typeof ASPECT_RATIO_PRESETS>(aspectRatioPreset)

  const aspect = ASPECT_RATIO_PRESETS[activePreset] ?? 4 / 3

  useEffect(() => {
    if (!open) return
    if (typeof image === 'string') {
      setImageUrl(image)
      return
    }
    const url = URL.createObjectURL(image)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [open, image])

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location)
  }, [])

  const onZoomChange = useCallback((z: number) => {
    setZoom(z)
  }, [])

  const onCropAreaChange = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!imageUrl || !croppedAreaPixels) return
    setIsProcessing(true)
    try {
      const blob = await getCroppedBlob(imageUrl, croppedAreaPixels)
      const geometry: CropGeometry = {
        x: croppedAreaPixels.x,
        y: croppedAreaPixels.y,
        width: croppedAreaPixels.width,
        height: croppedAreaPixels.height,
        aspectRatio: aspect,
      }
      onCropComplete(blob, geometry)
      onOpenChange(false)
    } catch (err) {
      console.error('Crop failed:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [imageUrl, croppedAreaPixels, aspect, onCropComplete, onOpenChange, image])

  const handleClose = useCallback(() => {
    setImageUrl('')
    setCroppedAreaPixels(null)
    onOpenChange(false)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl"
        showClose
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Aspect ratio</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(ASPECT_RATIO_PRESETS) as (keyof typeof ASPECT_RATIO_PRESETS)[]).map(
                (key: keyof typeof ASPECT_RATIO_PRESETS) => (
                  <Button
                    key={key}
                    type="button"
                    variant={activePreset === key ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      activePreset === key && 'border-accent bg-accent text-accent-foreground'
                    )}
                    onClick={() => setActivePreset(key)}
                  >
                    {PRESET_LABELS[key]}
                  </Button>
                )
              )}
            </div>
          </div>
          <div className="relative h-[320px] w-full overflow-hidden rounded-lg bg-muted">
            {imageUrl && (
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onCropComplete={onCropAreaChange}
                style={{ containerStyle: { backgroundColor: 'rgb(var(--muted))' } }}
              />
            )}
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-xs">Zoom</Label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-accent"
              aria-label="Zoom"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleClose()}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!croppedAreaPixels || isProcessing}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isProcessing ? 'Processing…' : 'Apply crop'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
