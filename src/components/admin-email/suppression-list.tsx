import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Search, Trash2, Mail } from 'lucide-react'
import type { SuppressionEntry } from '@/types/email'
import { cn } from '@/lib/utils'

export interface AdminSuppressionListProps {
  suppressions: SuppressionEntry[]
  isLoading: boolean
  search: string
  onSearchChange: (v: string) => void
  onAdd: (email: string, reason?: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
  isAdding: boolean
  isRemoving: boolean
}

function formatDate(d: string): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return String(d)
  }
}

export function AdminSuppressionList({
  suppressions,
  isLoading,
  search,
  onSearchChange,
  onAdd,
  onRemove,
  isAdding,
  isRemoving,
}: AdminSuppressionListProps) {
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newReason, setNewReason] = useState('')

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    await onAdd(email, newReason.trim() || undefined)
    setNewEmail('')
    setNewReason('')
    setAddModalOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="bg-accent hover:bg-accent/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add email
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 w-64 rounded bg-muted" />
                <div className="mt-2 h-3 w-32 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : suppressions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Mail className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-medium">No suppressions</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add emails manually or they will appear when bounces/unsubscribes occur.
            </p>
            <Button
              onClick={() => setAddModalOpen(true)}
              variant="outline"
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add email
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {suppressions.map((s) => (
            <Card
              key={s.id}
              className={cn(
                'transition-all hover:shadow-card',
                'animate-fade-in'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{s.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.reason ?? '—'} · {s.source ?? '—'} · {formatDate(s.added_at)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(s.id)}
                    disabled={isRemoving}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Add to suppression list</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@example.com"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="add-reason">Reason (optional)</Label>
              <Input
                id="add-reason"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="e.g. Manual request"
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={isAdding || !newEmail.trim()}
                className="bg-accent hover:bg-accent/90"
              >
                {isAdding ? 'Adding…' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
