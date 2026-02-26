import { Download, FileText, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { PrivacyRequest } from '@/types/settings'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  InProgress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Failed: 'bg-destructive/10 text-destructive',
}

export interface PrivacyRequestsStatusTrayProps {
  requests: PrivacyRequest[]
  isLoading?: boolean
}

export function PrivacyRequestsStatusTray({
  requests,
  isLoading = false,
}: PrivacyRequestsStatusTrayProps) {
  const list = Array.isArray(requests) ? requests : []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-serif text-lg font-semibold">Privacy requests</h3>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="mt-2 h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (list.length === 0) return null

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-card-hover">
      <CardHeader>
        <h3 className="font-serif text-lg font-semibold">Privacy requests</h3>
        <p className="text-sm text-muted-foreground">
          Status of your data export and deletion requests
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {list.map((req) => (
            <li
              key={req.id}
              className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                {req.type === 'export' ? (
                  <FileText className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Trash2 className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium capitalize">{req.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(req.createdAt ?? req.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                    statusColors[req.status] ?? 'bg-muted text-muted-foreground'
                  )}
                >
                  {req.status}
                </span>
                {req.status === 'Completed' && req.downloadUrl && (
                  <a
                    href={req.downloadUrl}
                    download
                    className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
