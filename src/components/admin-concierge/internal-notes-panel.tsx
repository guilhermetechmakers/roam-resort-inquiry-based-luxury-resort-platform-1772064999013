import { useState } from 'react'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { AdminInquiryDetailNote } from '@/types/admin'

export interface AdminInternalNotesPanelProps {
  notes: AdminInquiryDetailNote[]
  onAdd: (text: string) => Promise<void>
  onEdit?: (noteId: string, text: string) => Promise<void>
  onDelete?: (noteId: string) => Promise<void>
  isLoading?: boolean
  canEdit?: boolean
  className?: string
}

export function AdminInternalNotesPanel({
  notes,
  onAdd,
  onEdit,
  onDelete,
  isLoading,
  canEdit = true,
  className,
}: AdminInternalNotesPanelProps) {
  const [newNote, setNewNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const safeNotes = (notes ?? []).slice()

  const handleAdd = async () => {
    const text = newNote.trim()
    if (!text) return
    setIsSubmitting(true)
    try {
      await onAdd(text)
      setNewNote('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingId || !editText.trim() || !onEdit) return
    setIsSubmitting(true)
    try {
      await onEdit(editingId, editText.trim())
      setEditingId(null)
      setEditText('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId || !onDelete) return
    setIsSubmitting(true)
    try {
      await onDelete(deleteId)
      setDeleteId(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={cn('transition-all duration-300', className)}>
      <CardHeader>
        <h3 className="font-serif text-lg font-semibold">Internal notes</h3>
        <p className="text-sm text-muted-foreground">
          Private notes for staff only
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-16 animate-pulse rounded-lg bg-muted" />
            <div className="h-16 animate-pulse rounded-lg bg-muted" />
          </div>
        ) : (
          <>
            {safeNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8">
                <p className="text-sm text-muted-foreground">
                  No internal notes yet.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add a note to track staff actions.
                </p>
              </div>
            ) : (
              <ul className="space-y-3" role="list">
                {safeNotes.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:border-accent/30"
                  >
                    {editingId === note.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                          className="resize-none"
                          placeholder="Edit note..."
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleEdit}
                            disabled={!editText.trim() || isSubmitting}
                          >
                            {isSubmitting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(null)
                              setEditText('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap text-sm">{note.text}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {note.authorName} · {formatDateTime(note.createdAt)}
                          </span>
                          {canEdit && (onEdit || onDelete) && (
                            <div className="flex gap-1">
                              {onEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setEditingId(note.id)
                                    setEditText(note.text)
                                  }}
                                  aria-label="Edit note"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {onDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteId(note.id)}
                                  aria-label="Delete note"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {canEdit && (
              <div className="space-y-2 pt-4">
                <Label className="text-muted-foreground">Add note</Label>
                <Textarea
                  placeholder="Add internal note..."
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="resize-none bg-muted/30 focus:ring-accent"
                />
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!newNote.trim() || isSubmitting}
                  className="bg-accent hover:bg-accent/90"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add note
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
