import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils'
import type { InternalNote } from '@/types'
import { cn } from '@/lib/utils'

export interface InternalNotesPanelProps {
  notes: InternalNote[]
  inquiryId: string
  canEdit: boolean
  onAddNote?: (content: string) => Promise<void>
  isLoading?: boolean
  className?: string
}

export function InternalNotesPanel({
  notes,
  inquiryId: _inquiryId,
  canEdit,
  onAddNote,
  isLoading,
  className,
}: InternalNotesPanelProps) {
  const [newNote, setNewNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const safeNotes = Array.isArray(notes) ? notes : []

  const handleSubmit = async () => {
    const content = newNote.trim()
    if (!content || !onAddNote) return
    setIsSubmitting(true)
    try {
      await onAddNote(content)
      setNewNote('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-muted-foreground">Internal notes</Label>
        {canEdit && (
          <span className="text-xs text-muted-foreground">
            Staff & hosts only
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : (
        <>
          {safeNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No internal notes yet.
            </p>
          ) : (
            <div className="space-y-3">
              {safeNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg border border-border bg-muted/30 p-3"
                >
                  <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {note.authorName ?? 'Staff'} ·{' '}
                    {formatDate(note.createdAt ?? note.created_at ?? '')}
                  </p>
                </div>
              ))}
            </div>
          )}

          {canEdit && (
            <div className="space-y-2 pt-4">
              <Textarea
                placeholder="Add internal note..."
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="resize-none"
              />
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newNote.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Add note
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
