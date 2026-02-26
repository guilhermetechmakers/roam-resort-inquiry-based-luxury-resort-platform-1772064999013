import { ShieldOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { SuppressionEntry } from '@/types/email'

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

export interface AdminSuppressionListProps {
  entries: SuppressionEntry[]
  isLoading?: boolean
}

export function AdminSuppressionList({ entries, isLoading }: AdminSuppressionListProps) {
  const list = Array.isArray(entries) ? entries : []

  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading suppression list">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
        <span className="sr-only">Loading suppression list…</span>
      </div>
    )
  }

  if (list.length === 0) {
    return (
      <Card className="border-border shadow-card">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6">
          <div className="rounded-full bg-muted p-4">
            <ShieldOff className="h-12 w-12 text-muted-foreground" aria-hidden />
          </div>
          <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
            No suppressions
          </h3>
          <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
            No bounced or unsubscribed emails. Suppressed addresses will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {list.map((s) => (
        <Card key={s.id} className="border-border">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{s.email}</p>
              <p className="text-sm text-muted-foreground">
                {s.reason ?? '—'} · {s.source ?? '—'} · {formatDate(s.added_at)}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
