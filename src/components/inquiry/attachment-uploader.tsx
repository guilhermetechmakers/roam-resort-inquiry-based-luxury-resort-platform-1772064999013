import { useCallback, useRef } from 'react'
import { FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  MAX_ATTACHMENT_SIZE,
  ALLOWED_ATTACHMENT_TYPES,
} from '@/lib/validation/inquiry-validation'

export interface AttachmentFile {
  file: File
  id: string
  preview?: string
}

export interface AttachmentUploaderProps {
  onFilesChange: (files: AttachmentFile[]) => void
  files: AttachmentFile[]
  maxSize?: number
  allowedTypes?: string[]
  className?: string
}

const DEFAULT_MAX_SIZE = MAX_ATTACHMENT_SIZE
const DEFAULT_TYPES = ALLOWED_ATTACHMENT_TYPES

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function isImageType(mime: string): boolean {
  return IMAGE_TYPES.includes(mime)
}

export function AttachmentUploader({
  onFilesChange,
  files = [],
  maxSize = DEFAULT_MAX_SIZE,
  allowedTypes = DEFAULT_TYPES,
  className,
}: AttachmentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const safeFiles = Array.isArray(files) ? files : []

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `${file.name} exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`
      }
      const hasImage = /\.(jpe?g|png|webp|gif)$/i.test(file.name)
      const hasPdf = /\.pdf$/i.test(file.name)
      const hasDoc = /\.(docx?|doc)$/i.test(file.name)
      const typeOk =
        file.type?.startsWith('image/') ||
        file.type === 'application/pdf' ||
        file.type?.includes('word') ||
        hasImage ||
        hasPdf ||
        hasDoc
      if (!typeOk) {
        return `File type not allowed. Use: images, PDF, or DOC/DOCX`
      }
      return null
    },
    [maxSize]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files
      if (!selected?.length) return

      const newFiles: AttachmentFile[] = []
      for (let i = 0; i < selected.length; i++) {
        const file = selected[i]
        const err = validateFile(file)
        if (err) continue

        const id = `${file.name}-${file.size}-${Date.now()}-${i}`
        const preview = isImageType(file.type) ? URL.createObjectURL(file) : undefined
        newFiles.push({ file, id, preview })
      }

      onFilesChange([...safeFiles, ...newFiles])

      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [validateFile, onFilesChange, safeFiles]
  )

  const removeFile = useCallback(
    (id: string) => {
      const removed = safeFiles.find((f) => f.id === id)
      if (removed?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(removed.preview)
      }
      onFilesChange(safeFiles.filter((f) => f.id !== id))
    },
    [onFilesChange, safeFiles]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const dropped = e.dataTransfer.files
      if (!dropped?.length) return

      const newFiles: AttachmentFile[] = []
      for (let i = 0; i < dropped.length; i++) {
        const file = dropped[i]
        const err = validateFile(file)
        if (err) continue
        const id = `${file.name}-${file.size}-${Date.now()}-${i}`
        const preview = isImageType(file.type) ? URL.createObjectURL(file) : undefined
        newFiles.push({ file, id, preview })
      }
      onFilesChange([...safeFiles, ...newFiles])
    },
    [validateFile, onFilesChange, safeFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <div className={cn('space-y-3', className)}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30 p-6 transition-colors hover:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
        )}
        aria-label="Upload attachments"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleChange}
          className="sr-only"
          aria-describedby="attachment-hint"
        />
        <FileText className="h-10 w-10 text-muted-foreground" aria-hidden />
        <p className="mt-2 text-sm text-muted-foreground">
          Drag files here or click to upload
        </p>
        <p id="attachment-hint" className="mt-1 text-xs text-muted-foreground">
          PDF, DOCX, images up to {Math.round(maxSize / 1024 / 1024)}MB
        </p>
      </div>

      {safeFiles.length > 0 && (
        <ul className="space-y-2" role="list" aria-live="polite">
          {safeFiles.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              {item.preview ? (
                <img
                  src={item.preview}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-secondary">
                  <FileText className="h-6 w-6 text-muted-foreground" aria-hidden />
                </div>
              )}
              <span className="min-w-0 flex-1 truncate text-sm">{item.file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFile(item.id)}
                aria-label={`Remove ${item.file.name}`}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
