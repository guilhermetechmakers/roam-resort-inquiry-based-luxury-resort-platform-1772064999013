import { Mail } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { EmailJob } from '@/types/email'

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    queued: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    sending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    bounced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    suppressed: 'bg-muted text-muted-foreground',
  }
  return map[status] ?? 'bg-muted text-muted-foreground'
}

function formatDate(s: string | null): string {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleString()
  } catch {
    return s
  }
}

export interface AdminEmailJobsPanelProps {
  jobs: EmailJob[]
  isLoading?: boolean
  statusFilter?: string
  onStatusFilterChange?: (status: string) => void
}

export function AdminEmailJobsPanel({
  jobs,
  isLoading,
  statusFilter = 'all',
  onStatusFilterChange,
}: AdminEmailJobsPanelProps) {
  const list = Array.isArray(jobs) ? jobs : []

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {onStatusFilterChange && (
        <div className="flex flex-wrap gap-2">
          {['all', 'queued', 'sending', 'delivered', 'failed', 'bounced', 'suppressed'].map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => onStatusFilterChange(s)}
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                  statusFilter === s
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {s}
              </button>
            )
          )}
        </div>
      )}

      {list.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Mail className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No email jobs</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((j) => (
            <Card key={j.id} className="border-border">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-accent/10 p-2">
                    <Mail className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">{j.to}</p>
                    <p className="text-sm text-muted-foreground">
                      {j.template_slug ?? '—'} · {formatDate(j.created_at)}
                    </p>
                    {j.last_error && (
                      <p className="text-xs text-destructive mt-1 truncate max-w-md">
                        {j.last_error}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    getStatusClass(j.status)
                  )}
                >
                  {j.status}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
