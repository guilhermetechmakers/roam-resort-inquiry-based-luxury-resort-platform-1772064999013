import { Mail } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (list.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Mail className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No suppressions</p>
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
