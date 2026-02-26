/**
 * InternalNotesPanel - Private notes for staff with author/timestamp.
 * Add, edit, delete with proper guards: (notes ?? []).map(...)
 */

import { useState } from 'react'
import { Loader2, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { AdminInternalNote } from '@/types/admin'

export interface InternalNotesPanelProps {
  notes: AdminInternalNote[] | null | undefined
  onAdd: (text: string) => Promise<void>
  onEdit?: (noteId: string, text: string) => Promise<void>
  onDelete?: (noteId: string) => Promise<void>
  authorName?: string
  isLoading?: boolean
  isAdding?: boolean
  className?: string
}

export function InternalNotesPanel({
  notes,
  onAdd,
  onEdit,
  onDelete,
  authorName = 'Staff',
  isLoading,
  isAdding,
  className,
}: InternalNotesPanelProps) {
  const [newNote, setNewNote] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  const safeNotes = (notes ?? []).slice()

  const handleAdd = async () => {
    const text = newNote.trim()
    if (!text) return
    try {
      await onAdd(text)
      setNewNote('')
    } catch {
      // Error handled by parent
    }
  }

  const handleEdit = async () => {
    if (!editingId || !onEdit) return
    const text = editText.trim()
    if (!text) return
    try {
      await onEdit(editingId, text)
      setEditingId(null)
      setEditText('')
    } catch {
      // Error handled by parent
    }
  }

  const handleDelete = async () => {
    if (!deleteId || !onDelete) return
    try {
      await onDelete(deleteId)
      setDeleteId(null)
    } catch {
      // Error handled by parent
    }
  }

  const startEdit = (note: AdminInternalNote) => {
    setEditingId(note.id)
    setEditText(note.note ?? '')
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader
        className="flex flex-row items-center justify-between border-b border-border/50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="font-serif text-lg font-semibold">Internal Notes</h3>
        <button
          type="button"
          className="rounded p-1 text-muted-foreground hover:bg-muted"
          aria-expanded={expanded}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </CardHeader>
      <CardContent className="pt-6">
        {expanded && (
          <>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-16 animate-pulse rounded-lg bg-muted" />
                <div className="h-16 animate-pulse rounded-lg bg-muted" />
              </div>
            ) : (
              <>
                {safeNotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No internal notes yet.</p>
                ) : (
                  <ul className="space-y-3" role="list">
                    {safeNotes.map((note) => (
                      <li
                        key={note.id}
                        className="rounded-lg border border-border bg-muted/20 p-4 transition-colors hover:border-accent/20"
                      >
                        {editingId === note.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={3}
                              className="resize-none"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleEdit}>
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
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
                            <p className="whitespace-pre-wrap text-sm">{note.note ?? '—'}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                {note.authorName ?? authorName} ·{' '}
                                {formatDate(note.createdAt ?? '')}
                              </p>
                              <div className="flex gap-1">
                                {onEdit && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => startEdit(note)}
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
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 space-y-2">
                  <Label className="text-muted-foreground">Add note</Label>
                  <Textarea
                    placeholder="Add internal note (concierge only)..."
                    rows={3}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="resize-none bg-muted/30 focus:border-accent"
                  />
                  <Button
                    size="sm"
                    onClick={handleAdd}
                    disabled={!newNote.trim() || isAdding}
                    className="bg-accent hover:bg-accent/90"
                  >
                    {isAdding ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Add note
                  </Button>
                </div>
              </>
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
