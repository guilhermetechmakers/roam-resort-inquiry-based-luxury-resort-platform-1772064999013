import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sidebar, adminSidebarLinks } from '@/components/layout/sidebar'
import { useAuth } from '@/contexts/auth-context'
import { useAuditLogs, useExportAuditLogsCsv } from '@/hooks/use-audit-logs'
import { Download, Shield, RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const ACTION_TYPES = [
  'login_attempt', 'login_success', 'login_failure',
  'signup_attempt', 'signup_success', 'signup_failure',
  'password_reset_request', 'password_reset_success', 'password_reset_failure',
  'logout', 'session_created', 'session_revoked', 'session_revoke_all',
  'inquiry_export', 'status_changed', 'user_status_changed', 'payment_state_changed',
]

export function AdminAuditLogsPage() {
  const { hasRole, isLoading: authLoading } = useAuth()
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const filters = {
    action_type: actionFilter === 'all' ? undefined : actionFilter,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    limit: 200,
  }

  const { data, isLoading, refetch } = useAuditLogs(filters)
  const exportMutation = useExportAuditLogsCsv()

  const logs = Array.isArray(data?.logs) ? data.logs : []
  const count = data?.count ?? 0

  const handleExport = async () => {
    try {
      const blob = await exportMutation.mutateAsync(filters)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${logs.length} audit log entries`)
    } catch {
      toast.error('Failed to export audit logs')
    }
  }

  if (authLoading) return null
  if (!hasRole('concierge')) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar links={adminSidebarLinks} title="Concierge" />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-accent" />
            <h1 className="font-serif text-3xl font-bold">Audit Logs</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            View and export security and admin action logs for traceability.
          </p>

          <Card className="mt-8">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-serif text-xl font-semibold">Logs</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleExport}
                    disabled={exportMutation.isPending || logs.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <Label htmlFor="action-filter">Action type</Label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger id="action-filter" className="w-[180px]">
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All actions</SelectItem>
                      {ACTION_TYPES.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-from">From date</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-[160px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-to">To date</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-[160px]"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-muted-foreground">
                  Loading audit logs...
                </div>
              ) : logs.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No audit logs match your filters.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                        <th className="px-4 py-3 text-left font-medium">Action</th>
                        <th className="px-4 py-3 text-left font-medium">Resource</th>
                        <th className="px-4 py-3 text-left font-medium">Actor</th>
                        <th className="px-4 py-3 text-left font-medium">Success</th>
                        <th className="px-4 py-3 text-left font-medium">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-t border-border hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="px-4 py-3 font-medium">{log.action_type}</td>
                          <td className="px-4 py-3">
                            {log.resource ?? '-'}
                            {log.resource_id && ` (${log.resource_id.slice(0, 8)}...)`}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {log.actor_user_id?.slice(0, 8) ?? '-'}...
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'rounded px-2 py-0.5 text-xs',
                                log.success ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              )}
                            >
                              {log.success ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {log.ip_address ?? '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {logs.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Showing {logs.length} of {count} entries
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
