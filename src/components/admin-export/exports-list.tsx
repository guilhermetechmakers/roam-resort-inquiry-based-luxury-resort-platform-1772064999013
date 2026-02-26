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
  processing: { label: 'Processing', className: 'bg-warning/20 text-warning' },
  complete: { label: 'Complete', className: 'bg-success/20 text-success' },
  failed: { label: 'Failed', className: 'bg-destructive/20 text-destructive' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
}

export interface ExportsListProps {
  exports: ExportJob[]
  isLoading?: boolean
  onRetry?: (exportId: string) => void
  onCancel?: (exportId: string) => void
  onScrollToBuilder?: () => void
}

export function ExportsList({
  exports,
  isLoading = false,
  onRetry,
  onCancel,
  onScrollToBuilder,
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
      <Card className="rounded-xl border-border shadow-card transition-shadow duration-200 hover:shadow-card-hover">
        <CardHeader>
          <h2 id="exports-list-heading" className="font-serif text-xl font-semibold text-foreground">Recent Exports</h2>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
            role="status"
            aria-live="polite"
            aria-label="No exports yet. Create an export above to get started."
          >
            <div className="rounded-full bg-muted/50 p-4 mb-6">
              <FileSpreadsheet className="h-14 w-14 text-muted-foreground" aria-hidden />
            </div>
            <p className="text-lg font-medium text-foreground">No exports yet</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Create an export above to see your download history here. Select fields, apply filters, and download when ready.
            </p>
            {onScrollToBuilder && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onScrollToBuilder}
                className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90"
                aria-label="Scroll to export builder to create your first export"
              >
                Create your first export
              </Button>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Tip: Use date range presets for common periods like Last 30 days.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl border-border shadow-card transition-shadow duration-200">
      <CardHeader>
        <h2 id="exports-list-heading" className="font-serif text-xl font-semibold text-foreground">Recent Exports</h2>
        <p className="text-sm text-muted-foreground">
          Export jobs with status and download links.
        </p>
      </CardHeader>
      <CardContent>
        <div
          className="space-y-4"
          role="list"
          aria-labelledby="exports-list-heading"
          aria-label="List of export jobs"
        >
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
      role="listitem"
      className={cn(
        'rounded-lg border border-border p-4 transition-all duration-200 hover:border-accent/30 hover:shadow-sm',
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
            ariaLabel={`Download CSV export ${job.dataset} (${job.id.slice(0, 8)})`}
          />
        )}
        {canRetry && onRetry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRetry(job.id)}
            aria-label={`Retry failed export ${job.id.slice(0, 8)}`}
            title="Retry this failed export"
          >
            <RotateCw className="h-4 w-4" aria-hidden />
            Retry
          </Button>
        )}
        {canCancel && onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onCancel(job.id)}
            aria-label={`Cancel export ${job.id.slice(0, 8)}`}
            title="Cancel this export job"
          >
            <X className="h-4 w-4" aria-hidden />
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
