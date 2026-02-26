import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import { adminSidebarLinks } from '@/components/layout/sidebar'
import { AdminReviewPanel, AuditLogView } from '@/components/privacy'
import {
  fetchAdminPrivacyRequests,
  adminPrivacyAction,
  fetchAuditLogs,
} from '@/api/privacy-compliance'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import type { PrivacyRequest } from '@/types/privacy-compliance'
import type { AuditLogEntry } from '@/components/privacy/audit-log-view'

const PRIVACY_REQUESTS_KEY = ['admin', 'privacy-requests']
const AUDIT_LOGS_KEY = ['admin', 'audit-logs']

export function AdminPrivacyRequestsPage() {
  const { hasRole } = useAuth()
  const [typeFilter, setTypeFilter] = useState<'export' | 'delete' | ''>('')
  const [statusFilter, setStatusFilter] = useState('')
  const [auditFilters, setAuditFilters] = useState<{
    actionType?: string
    dateFrom?: string
    dateTo?: string
  }>({})

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: [...PRIVACY_REQUESTS_KEY, typeFilter, statusFilter],
    queryFn: () =>
      fetchAdminPrivacyRequests({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      }),
    enabled: hasRole('concierge'),
  })

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: [...AUDIT_LOGS_KEY, auditFilters],
    queryFn: () =>
      fetchAuditLogs({
        actionType: auditFilters.actionType,
        dateFrom: auditFilters.dateFrom,
        dateTo: auditFilters.dateTo,
        limit: 200,
      }),
    enabled: hasRole('concierge'),
  })

  const handleApprove = useCallback(
    async (requestId: string, notes?: string, retentionDays?: number) => {
      try {
        await adminPrivacyAction('approve', requestId, { notes, retentionWindowDays: retentionDays })
        toast.success('Request approved')
        refetch()
      } catch (err) {
        toast.error((err as Error).message)
      }
    },
    [refetch]
  )

  const handleReject = useCallback(
    async (requestId: string, notes?: string) => {
      try {
        await adminPrivacyAction('reject', requestId, { notes })
        toast.success('Request rejected')
        refetch()
      } catch (err) {
        toast.error((err as Error).message)
      }
    },
    [refetch]
  )

  const handleConfirmExport = useCallback(
    async (requestId: string) => {
      try {
        const res = await adminPrivacyAction('confirm-export', requestId)
        toast.success(res.downloadUrl ? 'Export ready' : 'Export confirmed')
        refetch()
      } catch (err) {
        toast.error((err as Error).message)
      }
    },
    [refetch]
  )

  const handleScheduleDelete = useCallback(
    async (requestId: string, retentionDays: number, notes?: string) => {
      try {
        await adminPrivacyAction('schedule-delete', requestId, {
          notes,
          retentionWindowDays: retentionDays,
        })
        toast.success('Deletion scheduled')
        refetch()
      } catch (err) {
        toast.error((err as Error).message)
      }
    },
    [refetch]
  )

  const mappedRequests: Array<{
    id: string
    userId: string
    userEmail?: string
    type: 'export' | 'delete'
    status: string
    requestedAt: string
    completedAt?: string
    downloadUrl?: string
    scope?: string[]
    notes?: string
  }> = (requests ?? []).map((r: PrivacyRequest) => ({
    id: r.id,
    userId: r.userId,
    userEmail: undefined,
    type: r.type,
    status: r.status,
    requestedAt: r.requestedAt,
    completedAt: r.completedAt ?? undefined,
    downloadUrl: r.downloadUrl ?? undefined,
    scope: r.scope ?? [],
    notes: r.notes ?? undefined,
  }))

  const mappedAuditLogs: AuditLogEntry[] = (auditLogs ?? []).map((e) => ({
    id: e.id,
    actorUserId: e.actorUserId,
    actionType: e.actionType,
    resourceId: e.resourceId,
    description: e.description,
    timestamp: e.timestamp,
    details: e.details,
  }))

  return (
    <div className="flex min-h-screen">
      <Sidebar links={adminSidebarLinks} title="Admin" />
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="font-serif text-3xl font-bold text-foreground">
              Privacy & Compliance
            </h1>
            <p className="mt-2 text-muted-foreground">
              Review data export and account deletion requests
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-wrap gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'export' | 'delete' | '')}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All types</option>
              <option value="export">Export</option>
              <option value="delete">Delete</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="InProgress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          <AdminReviewPanel
            requests={mappedRequests}
            isLoading={isLoading}
            onApprove={handleApprove}
            onReject={handleReject}
            onConfirmExport={handleConfirmExport}
            onScheduleDelete={handleScheduleDelete}
          />

          <AuditLogView
            logs={mappedAuditLogs}
            isLoading={auditLoading}
            onFilterChange={(f) =>
              setAuditFilters({
                actionType: f.actionType,
                dateFrom: f.from,
                dateTo: f.to,
              })
            }
          />
        </div>
      </div>
    </div>
  )
}
