/**
 * List of recent export jobs with status, metadata, actions.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CSVDownloadLink } from './csv-download-link'
import { RotateCw, X, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchDownloadUrl } from '@/api/admin-export'
import type { ExportJob } from '@/types/export'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  queued: { label: 'Queued', className: 'bg-muted text-muted-foreground' },
  processing: { label: 'Processing', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  complete: { label: 'Complete', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
}

export interface ExportsListProps {
  exports: ExportJob[]
  isLoading?: boolean
  onRetry?: (exportId: string) => void
  onCancel?: (exportId: string) => void
}

export function ExportsList({
  exports,
  isLoading = false,
  onRetry,
  onCancel,
}: ExportsListProps) {
  const safeExports = Array.isArray(exports) ? exports : []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="font-serif text-xl font-semibold">Recent Exports</h2>
        </CardHeader>
        <CardContent>
          <ExportsListSkeleton />
        </CardContent>
      </Card>
    )
  }

  if (safeExports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 className="font-serif text-xl font-semibold">Recent Exports</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground/50 mb-4" aria-hidden />
            <p className="text-muted-foreground">No exports yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create an export above to see your download history here.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-serif text-xl font-semibold">Recent Exports</h2>
        <p className="text-sm text-muted-foreground">
          Export jobs with status and download links.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {safeExports.map((job) => (
            <ExportJobRow
              key={job.id}
              job={job}
              onRetry={onRetry}
              onCancel={onCancel}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ExportJobRow({
  job,
  onRetry,
  onCancel,
}: {
  job: ExportJob
  onRetry?: (id: string) => void
  onCancel?: (id: string) => void
}) {
  const config = STATUS_CONFIG[job.status] ?? {
    label: job.status,
    className: 'bg-muted text-muted-foreground',
  }
  const fieldsPreview = (job.fields ?? []).slice(0, 3).join(', ')
  const dateRange = `${(job.date_from ?? '').slice(0, 10)} – ${(job.date_to ?? '').slice(0, 10)}`
  const canRetry = job.status === 'failed'
  const canCancel = job.status === 'queued' || job.status === 'processing'

  return (
    <div
      className={cn(
        'rounded-lg border border-border p-4 transition-colors hover:border-accent/30',
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">
            {job.id.slice(0, 8)}…
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              config.className
            )}
          >
            {config.label}
          </span>
          <span className="text-sm capitalize">{job.dataset}</span>
        </div>
        <p className="text-sm text-muted-foreground truncate" title={fieldsPreview}>
          {fieldsPreview}
          {(job.fields ?? []).length > 3 && '…'}
        </p>
        <p className="text-xs text-muted-foreground">{dateRange}</p>
        {job.rows_exported != null && (
          <p className="text-xs text-muted-foreground">
            {job.rows_exported} rows exported
          </p>
        )}
        {job.error_message && (
          <p className="text-xs text-destructive" role="alert">
            {job.error_message}
          </p>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        {job.status === 'complete' && (
          <CSVDownloadLink
            url={job.download_url ?? null}
            exportId={job.id}
            onFetchUrl={fetchDownloadUrl}
            filename={`export-${job.dataset}-${job.id.slice(0, 8)}.csv`}
          />
        )}
        {canRetry && onRetry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRetry(job.id)}
            aria-label="Retry export"
          >
            <RotateCw className="h-4 w-4" />
            Retry
          </Button>
        )}
        {canCancel && onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onCancel(job.id)}
            aria-label="Cancel export"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}

function ExportsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-lg bg-muted/50"
          aria-hidden
        />
      ))}
    </div>
  )
}
