import { useState, useCallback } from 'react'
import { Filter, FileText, Trash2, Mail, Shield, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDateTime } from '@/lib/utils'

export interface AuditLogEntry {
  id: string
  actorUserId?: string | null
  actionType: string
  resourceId?: string | null
  description?: string | null
  timestamp: string
  details?: Record<string, unknown>
}

export interface AuditLogViewProps {
  logs: AuditLogEntry[]
  isLoading?: boolean
  onFilterChange?: (filters: {
    actionType?: string
    userId?: string
    from?: string
    to?: string
  }) => void
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  export_requested: <FileText className="h-4 w-4" />,
  privacy_export_request: <FileText className="h-4 w-4" />,
  export_approved: <FileText className="h-4 w-4" />,
  export_completed: <FileText className="h-4 w-4" />,
  delete_requested: <Trash2 className="h-4 w-4" />,
  privacy_delete_request: <Trash2 className="h-4 w-4" />,
  delete_approved: <Trash2 className="h-4 w-4" />,
  delete_scheduled: <Trash2 className="h-4 w-4" />,
  request_rejected: <Shield className="h-4 w-4" />,
  consent_change: <Mail className="h-4 w-4" />,
  email_verified: <Mail className="h-4 w-4" />,
}

export function AuditLogView({
  logs,
  isLoading = false,
  onFilterChange,
}: AuditLogViewProps) {
  const [actionType, setActionType] = useState<string>('')
  const [userId, setUserId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const handleApplyFilters = useCallback(() => {
    onFilterChange?.({
      actionType: actionType || undefined,
      userId: userId.trim() || undefined,
      from: from || undefined,
      to: to || undefined,
    })
  }, [actionType, userId, from, to, onFilterChange])

  const list = Array.isArray(logs) ? logs : []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-serif text-xl font-semibold">Audit Log</h3>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden transition-all duration-300">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          <h3 className="font-serif text-xl font-semibold">Audit Log</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Consent changes, verifications, export and deletion events
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {onFilterChange && (
          <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs uppercase text-muted-foreground">Filters</Label>
            </div>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="export_requested">Export requested</SelectItem>
                <SelectItem value="export_approved">Export approved</SelectItem>
                <SelectItem value="export_completed">Export completed</SelectItem>
                <SelectItem value="delete_requested">Delete requested</SelectItem>
                <SelectItem value="delete_approved">Delete approved</SelectItem>
                <SelectItem value="delete_scheduled">Delete scheduled</SelectItem>
                <SelectItem value="request_rejected">Request rejected</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-48"
            />
            <Input
              type="date"
              placeholder="From"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-40"
            />
            <Input
              type="date"
              placeholder="To"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-40"
            />
            <Button size="sm" onClick={handleApplyFilters} className="bg-accent hover:bg-accent/90">
              Apply
            </Button>
          </div>
        )}

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-8 text-center">
              No audit log entries
            </p>
          ) : (
            list.map((entry) => (
              <div
                key={entry.id}
                className="flex gap-3 rounded-lg border border-border p-3 text-sm"
              >
                <span className="shrink-0 text-muted-foreground mt-0.5">
                  {ACTION_ICONS[entry.actionType] ?? <Activity className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{entry.actionType?.replace(/_/g, ' ') ?? '—'}</p>
                  <p className="text-muted-foreground truncate">
                    {entry.description ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {entry.actorUserId ? `${String(entry.actorUserId).slice(0, 8)}… · ` : ''}
                    {formatDateTime(entry.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
