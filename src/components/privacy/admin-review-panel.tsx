import { useState, useCallback } from 'react'
import { Check, X, Download, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/utils'

export interface PrivacyRequestRow {
  id: string
  userId: string
  userEmail?: string
  type: 'export' | 'delete'
  status: string
  requestedAt: string
  completedAt?: string
  downloadUrl?: string
  scope?: string[]
  notes?: string
}

export interface AdminReviewPanelProps {
  requests: PrivacyRequestRow[]
  isLoading?: boolean
  onApprove: (requestId: string, notes?: string, retentionDays?: number) => Promise<void>
  onReject: (requestId: string, notes?: string) => Promise<void>
  onConfirmExport: (requestId: string) => Promise<void>
  onScheduleDelete: (requestId: string, retentionDays: number, notes?: string) => Promise<void>
}

const statusBadgeClass: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  InProgress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Failed: 'bg-destructive/10 text-destructive',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-destructive/10 text-destructive',
  scheduled: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
}

export function AdminReviewPanel({
  requests,
  isLoading = false,
  onApprove,
  onReject,
  onConfirmExport,
  onScheduleDelete,
}: AdminReviewPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [retentionDays, setRetentionDays] = useState(30)
  const [actionLoading, setActionLoading] = useState(false)

  const selected = (requests ?? []).find((r) => r.id === selectedId)
  const list = Array.isArray(requests) ? requests : []

  const handleAction = useCallback(
    async (
      action: 'approve' | 'reject' | 'confirm-export' | 'schedule-delete'
    ) => {
      if (!selectedId) return
      setActionLoading(true)
      try {
        if (action === 'approve') {
          if (selected?.type === 'export') {
            await onApprove(selectedId, notes)
          } else {
            await onScheduleDelete(selectedId, retentionDays, notes)
          }
        } else if (action === 'reject') {
          await onReject(selectedId, notes)
        } else if (action === 'confirm-export') {
          await onConfirmExport(selectedId)
        } else if (action === 'schedule-delete') {
          await onScheduleDelete(selectedId, retentionDays, notes)
        }
        setSelectedId(null)
        setNotes('')
      } finally {
        setActionLoading(false)
      }
    },
    [selectedId, selected?.type, notes, retentionDays, onApprove, onReject, onConfirmExport, onScheduleDelete]
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-serif text-xl font-semibold">Privacy Requests</h3>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="mt-4 h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (list.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-serif text-xl font-semibold">Privacy Requests</h3>
          <p className="text-sm text-muted-foreground">No pending requests</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            Data export and account deletion requests will appear here for review.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="overflow-hidden transition-all duration-300">
        <CardHeader>
          <h3 className="font-serif text-xl font-semibold">Privacy Requests</h3>
          <p className="text-sm text-muted-foreground">
            Review and process data export and account deletion requests
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {list.map((req) => (
              <div
                key={req.id}
                className={cn(
                  'flex flex-col gap-3 rounded-lg border border-border p-4 transition-all',
                  'hover:border-accent/50 hover:shadow-card',
                  selectedId === req.id && 'border-accent ring-2 ring-accent/20'
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {req.type === 'export' ? (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Trash2 className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium capitalize">{req.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {req.userEmail ?? req.userId.slice(0, 8)} · {formatDateTime(req.requestedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                        statusBadgeClass[req.status] ?? 'bg-muted text-muted-foreground'
                      )}
                    >
                      {req.status}
                    </span>
                    {(req.status === 'Pending' || req.status === 'InProgress') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedId(selectedId === req.id ? null : req.id)}
                        className="border-accent/30 hover:border-accent"
                      >
                        Review
                      </Button>
                    )}
                    {req.status === 'Completed' && req.downloadUrl && (
                      <a
                        href={req.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selected?.type === 'export' ? 'Export Request' : 'Deletion Request'}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">User</p>
                <p className="font-medium">{selected.userEmail ?? selected.userId}</p>
              </div>
              <div>
                <Label htmlFor="admin-notes">Notes (optional)</Label>
                <Input
                  id="admin-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes for this request"
                  className="mt-1"
                />
              </div>
              {selected.type === 'delete' && (
                <div>
                  <Label htmlFor="retention-days">Retention window (days)</Label>
                  <Input
                    id="retention-days"
                    type="number"
                    min={7}
                    max={90}
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(Math.max(7, Math.min(90, parseInt(e.target.value, 10) || 30)))}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {(selected?.status === 'Pending' || selected?.status === 'InProgress') && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleAction('reject')}
                  disabled={actionLoading}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                {selected?.type === 'export' ? (
                  <Button
                    onClick={() => handleAction('confirm-export')}
                    disabled={actionLoading}
                    className="bg-accent hover:bg-accent/90"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Confirm Export
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleAction('schedule-delete')}
                    disabled={actionLoading}
                    className="bg-accent hover:bg-accent/90"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Schedule Deletion
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
