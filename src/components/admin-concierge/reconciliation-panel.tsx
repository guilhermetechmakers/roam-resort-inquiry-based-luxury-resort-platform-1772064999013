/**
 * ReconciliationPanel - Displays reconciliation history for an inquiry.
 * Shows status, notes, reconciled date, and reconciled by.
 * Supports refresh with toast feedback, error state, and loading states.
 */

import { useState } from 'react'
import { FileCheck, Clock, RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  /** Optional refresh handler; when provided, shows a refresh button with loading state */
  onRefresh?: () => Promise<void>
  /** Whether a refresh is in progress */
  isRefreshing?: boolean
  /** Error to display with retry option */
  error?: Error | null
  /** Retry handler when error is shown */
  onRetry?: () => void
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

function getStatusClassName(status: string): string {
  switch (status) {
    case 'reconciled':
      return 'bg-accent/20 text-accent-foreground'
    case 'paid':
      return 'bg-success/20 text-success dark:text-success/90'
    case 'confirmed':
      return 'bg-info/20 text-info dark:text-info/90'
    case 'pending':
    default:
      return 'bg-muted text-muted-foreground'
  }
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
  onRefresh,
  isRefreshing,
  error,
  onRetry,
  className,
}: ReconciliationPanelProps) {
  const [isRefreshingLocal, setIsRefreshingLocal] = useState(false)
  const list = (reconciliations ?? []).slice()
  const hasRefresh = typeof onRefresh === 'function'
  const refreshing = isRefreshing ?? isRefreshingLocal

  const handleRefresh = async () => {
    if (!onRefresh) return
    setIsRefreshingLocal(true)
    try {
      await onRefresh()
      toast.success('Reconciliation history refreshed')
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Failed to refresh reconciliation history')
    } finally {
      setIsRefreshingLocal(false)
    }
  }

  const handleRetry = () => {
    onRetry?.()
  }

  return (
    <Card
      className={cn('transition-all duration-300', className)}
      aria-labelledby="reconciliation-panel-heading"
      aria-describedby="reconciliation-panel-description"
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
        <div>
          <h3
            id="reconciliation-panel-heading"
            className="font-serif text-lg font-semibold"
          >
            Reconciliation history
          </h3>
          <p
            id="reconciliation-panel-description"
            className="text-sm text-muted-foreground"
          >
            Payment reconciliation records for this inquiry
          </p>
        </div>
        {hasRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing ?? isLoading}
            aria-label="Refresh reconciliation history"
            aria-busy={refreshing ?? false}
            className="shrink-0 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {refreshing ? (
              <RefreshCw
                className="h-4 w-4 animate-spin"
                aria-hidden
              />
            ) : (
              <RefreshCw
                className="h-4 w-4"
                aria-hidden
              />
            )}
            <span className="sr-only">Refresh reconciliation history</span>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div
            className="h-24 animate-pulse rounded-lg bg-muted"
            role="status"
            aria-label="Loading reconciliation records"
          >
            <span className="sr-only">Loading reconciliation records</span>
          </div>
        ) : error ? (
          <div
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-8 text-center"
            role="alert"
          >
            <AlertCircle
              className="mb-2 h-10 w-10 text-destructive"
              aria-hidden
            />
            <p className="text-sm font-medium text-foreground">
              Failed to load reconciliation records
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {error.message}
            </p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="mt-4"
                aria-label="Retry loading reconciliation records"
              >
                Try again
              </Button>
            )}
          </div>
        ) : list.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-8 text-center"
            role="status"
          >
            <FileCheck
              className="mb-2 h-10 w-10 text-muted-foreground/50"
              aria-hidden
            />
            <p className="text-sm text-muted-foreground">
              No reconciliation records yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mark a payment as received to create a record
            </p>
          </div>
        ) : (
          <ul
            className="space-y-3"
            role="list"
            aria-label="Reconciliation records"
          >
            {list.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/30 hover:shadow-sm"
                role="listitem"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        getStatusClassName(r.status)
                      )}
                      aria-label={`Status: ${getStatusLabel(r.status)}`}
                    >
                      {getStatusLabel(r.status)}
                    </span>
                    <span
                      className="flex items-center gap-1 text-xs text-muted-foreground"
                      aria-label={`Reconciled at: ${formatDate(r.reconciledAt)}`}
                    >
                      <Clock
                        className="h-3.5 w-3.5"
                        aria-hidden
                      />
                      {formatDate(r.reconciledAt)}
                    </span>
                  </div>
                </div>
                {r.notes?.trim() && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {r.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
