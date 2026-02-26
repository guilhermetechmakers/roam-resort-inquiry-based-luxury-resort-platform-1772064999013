/**
 * Audit Logs API - fetch and export audit logs (concierge only).
 */

import { supabase } from '@/lib/supabase'

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : ''

export interface AuditLog {
  id: string
  actor_user_id: string | null
  action_type: string
  resource: string | null
  resource_id: string | null
  timestamp: string
  ip_address: string | null
  user_agent: string | null
  success: boolean
  details: Record<string, unknown>
}

export interface AuditLogsFilters {
  action_type?: string
  date_from?: string
  date_to?: string
  limit?: number
}

/** Fetch audit logs (concierge only) */
export async function fetchAuditLogs(
  filters?: AuditLogsFilters
): Promise<{ logs: AuditLog[]; count: number }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { logs: [], count: 0 }

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('timestamp', { ascending: false })
    .limit(Math.min(filters?.limit ?? 100, 500))

  if (filters?.action_type) {
    query = query.eq('action_type', filters.action_type)
  }
  if (filters?.date_from) {
    query = query.gte('timestamp', filters.date_from)
  }
  if (filters?.date_to) {
    query = query.lte('timestamp', filters.date_to)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message ?? 'Failed to fetch audit logs')
  }

  const list = Array.isArray(data) ? data : []
  const logs: AuditLog[] = list.map((r: Record<string, unknown>) => ({
    id: String(r.id ?? ''),
    actor_user_id: (r.actor_user_id as string) ?? null,
    action_type: String(r.action_type ?? ''),
    resource: (r.resource as string) ?? null,
    resource_id: (r.resource_id as string) ?? null,
    timestamp: String(r.timestamp ?? ''),
    ip_address: (r.ip_address as string) ?? null,
    user_agent: (r.user_agent as string) ?? null,
    success: r.success === true,
    details: (r.details as Record<string, unknown>) ?? {},
  }))

  return { logs, count: count ?? 0 }
}

/** Export audit logs as CSV (concierge only) */
export async function exportAuditLogsCsv(filters?: AuditLogsFilters): Promise<Blob> {
  if (!FUNCTIONS_URL) {
    const { logs } = await fetchAuditLogs(filters)
    return new Blob([auditLogsToCsv(logs)], { type: 'text/csv;charset=utf-8;' })
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Unauthorized')

  const res = await fetch(`${FUNCTIONS_URL}/audit-export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      action_type: filters?.action_type ?? null,
      date_from: filters?.date_from ?? null,
      date_to: filters?.date_to ?? null,
      limit: filters?.limit ?? 1000,
    }),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err?.error ?? 'Failed to export audit logs')
  }

  return res.blob()
}

function escapeCsvCell(value: unknown): string {
  if (value == null) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function auditLogsToCsv(logs: AuditLog[]): string {
  const headers = ['id', 'actor_user_id', 'action_type', 'resource', 'resource_id', 'timestamp', 'ip_address', 'user_agent', 'success', 'details']
  const rows = (logs ?? []).map((r) =>
    headers.map((h) => escapeCsvCell((r as unknown as Record<string, unknown>)[h])).join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}
