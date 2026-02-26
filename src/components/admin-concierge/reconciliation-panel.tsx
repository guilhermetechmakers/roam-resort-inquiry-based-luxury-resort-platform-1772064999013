/**
 * ReconciliationPanel - Displays reconciliation history for an inquiry.
 * Shows status, notes, reconciled date, and reconciled by.
 */

import { FileCheck, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface ReconciliationRecord {
  id: string
  status: string
  notes: string | null
  reconciledAt: string | null
  reconciledBy: string | null
}

export interface ReconciliationPanelProps {
  reconciliations: ReconciliationRecord[]
  isLoading?: boolean
  className?: string
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    confirmed: 'Confirmed',
    reconciled: 'Reconciled',
  }
  return map[status] ?? status
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function ReconciliationPanel({
  reconciliations,
  isLoading,
  className,
}: ReconciliationPanelProps) {
  const list = (reconciliations ?? []).slice()

  return (
    <Card className={cn('transition-all duration-300', className)}>
      <CardHeader>
        <h3 className="font-serif text-lg font-semibold">Reconciliation history</h3>
        <p className="text-sm text-muted-foreground">
          Payment reconciliation records for this inquiry
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-8 text-center">
            <FileCheck className="mb-2 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No reconciliation records yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mark a payment as received to create a record
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        r.status === 'reconciled' && 'bg-accent/20 text-accent-foreground',
                        r.status === 'paid' && 'bg-green-500/20 text-green-700 dark:text-green-400',
                        r.status === 'confirmed' && 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
                        r.status === 'pending' && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {getStatusLabel(r.status)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(r.reconciledAt)}
                    </span>
                  </div>
                </div>
                {r.notes?.trim() && (
                  <p className="mt-2 text-sm text-muted-foreground">{r.notes}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
