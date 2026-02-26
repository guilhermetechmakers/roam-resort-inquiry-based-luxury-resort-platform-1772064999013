import { useCallback, useRef } from 'react'
import { Upload, FileText, Image, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_SIZE,
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
}

const DEFAULT_MAX_SIZE = MAX_ATTACHMENT_SIZE
const DEFAULT_TYPES = ALLOWED_ATTACHMENT_TYPES

export function AttachmentUploader({
  onFilesChange,
  files = [],
  maxSize = DEFAULT_MAX_SIZE,
  allowedTypes = DEFAULT_TYPES,
}: AttachmentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `File "${file.name}" exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`
      }
      const type = file.type?.toLowerCase()
      const allowed = allowedTypes.map((t) => t.toLowerCase())
      if (type && allowed.length > 0 && !allowed.some((a) => type.includes(a.split('/')[0]) || type === a)) {
        const ext = file.name.split('.').pop()?.toLowerCase()
        const hasImage = /\.(jpe?g|png|webp|gif)$/i.test(file.name)
        const hasPdf = /\.pdf$/i.test(file.name)
        const hasDoc = /\.(docx?|doc)$/i.test(file.name)
        if (!hasImage && !hasPdf && !hasDoc) {
          return `File type not allowed. Use: images, PDF, or DOC/DOCX`
        }
      }
      return null
    },
    [maxSize, allowedTypes]
  )

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles?.length) return
      const current = files ?? []
      const added: AttachmentFile[] = []
      const errors: string[] = []

      Array.from(newFiles).forEach((file) => {
        const err = validateFile(file)
        if (err) {
          errors.push(err)
          return
        }
        const id = `${file.name}-${file.size}-${Date.now()}`
        const isImage = file.type.startsWith('image/')
        added.push({
          file,
          id,
          preview: isImage ? URL.createObjectURL(file) : undefined,
        })
      })

      if (errors.length > 0) {
        errors.forEach((e) => console.warn(e))
      }

      const next = [...current, ...added]
      onFilesChange(next)
    },
    [files, validateFile, onFilesChange]
  )

  const removeFile = useCallback(
    (id: string) => {
      const current = files ?? []
      const removed = current.find((f) => f.id === id)
      if (removed?.preview) URL.revokeObjectURL(removed.preview)
      onFilesChange(current.filter((f) => f.id !== id))
    },
    [files, onFilesChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const fileList = files ?? []

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          'flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-secondary/20 p-6',
          'transition-colors duration-200 hover:border-accent/50 hover:bg-secondary/30',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
        aria-label="Upload attachments"
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, DOC, DOCX, images up to {Math.round(maxSize / 1024 / 1024)}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {fileList.length > 0 && (
        <ul className="space-y-2" role="list">
          {fileList.map((item) => (
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
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(item.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFile(item.id)}
                aria-label={`Remove ${item.file.name}`}
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
