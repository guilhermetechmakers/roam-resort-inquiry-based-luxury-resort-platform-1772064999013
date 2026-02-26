/**
 * CloudinaryUploader - drag-and-drop, validation, cropping, upload to Cloudinary.
 */

import { useCallback, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImageCropper } from './image-cropper'
import { useUploadMedia } from '@/hooks/use-media'
import type { MediaAssetType, MediaOwnerType } from '@/types/media'
import { ASPECT_RATIO_PRESETS } from '@/types/media'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export interface CloudinaryUploaderProps {
  type: MediaAssetType
  ownerType: MediaOwnerType
  ownerId: string
  onSuccess?: (asset: { id: string; secure_url: string; public_id: string }) => void
  onError?: (message: string) => void
  aspectRatioPreset?: keyof typeof ASPECT_RATIO_PRESETS
  disabled?: boolean
  className?: string
}

export function CloudinaryUploader({
  type,
  ownerType,
  ownerId,
  onSuccess,
  onError,
  aspectRatioPreset = 'gallery',
  disabled,
  className,
}: CloudinaryUploaderProps) {
  const [cropOpen, setCropOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useUploadMedia()

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, WebP, and GIF images are allowed'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be under 20MB'
    }
    return null
  }, [])

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files?.length || disabled) return
      const file = files[0]
      const err = validateFile(file)
      if (err) {
        onError?.(err)
        return
      }
      setPendingFile(file)
      setCropOpen(true)
    },
    [disabled, validateFile, onError]
  )

  const handleCropComplete = useCallback(
    async (blob: Blob) => {
      if (!pendingFile || !ownerId) return
      const file = new File([blob], pendingFile.name, { type: 'image/jpeg' })
      setPendingFile(null)
      setCropOpen(false)

      const result = await uploadMutation.mutateAsync({
        file,
        type,
        ownerType,
        ownerId,
      })

      if (result.success && result.asset) {
        onSuccess?.({
          id: result.asset.id,
          secure_url: result.asset.secure_url,
          public_id: result.asset.public_id,
        })
      } else {
        onError?.(result.error ?? 'Upload failed')
      }
    },
    [pendingFile, ownerId, type, ownerType, uploadMutation, onSuccess, onError]
  )

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        onDrop={(e) => {
          e.preventDefault()
          if (disabled) return
          handleFileSelect(e.dataTransfer.files)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (disabled) return
        }}
        className={cn(
          'flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200',
          'hover:border-accent/50 hover:bg-accent/5',
          disabled && 'cursor-not-allowed opacity-50',
          'border-border bg-secondary/30',
          className
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
        />
        <Upload className="h-10 w-10 text-muted-foreground" aria-hidden />
        <span className="mt-2 text-sm font-medium text-muted-foreground">
          Drop image or click to upload
        </span>
        <span className="mt-1 text-xs text-muted-foreground">
          JPEG, PNG, WebP, GIF · Max 20MB
        </span>
      </div>

      {pendingFile && (
        <ImageCropper
          image={pendingFile}
          open={cropOpen}
          onOpenChange={setCropOpen}
          onCropComplete={handleCropComplete}
          aspectRatioPreset={aspectRatioPreset}
        />
      )}
    </>
  )
}
