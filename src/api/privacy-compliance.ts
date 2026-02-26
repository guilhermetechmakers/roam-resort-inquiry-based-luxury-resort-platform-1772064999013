/**
 * Privacy compliance API - export, delete, admin requests, audit logs, preferences.
 * Uses Supabase Edge Functions when VITE_API_URL is not set.
 */
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import type { PrivacyRequest, AuditLogEntry, UserPreferences } from '@/types/privacy-compliance'

const API_BASE = import.meta.env.VITE_API_URL

/** Request data export with scope */
export async function requestDataExport(scope: string[]): Promise<{ exportId: string; status: string }> {
  if (API_BASE) {
    const res = await api.post<{ exportId?: string; status?: string }>('/privacy/export/request', {
      scope,
    })
    return {
      exportId: res?.exportId ?? '',
      status: res?.status ?? 'received',
    }
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  const { data, error } = await supabase.functions.invoke<{ exportId?: string; status?: string }>(
    'privacy-export',
    { body: { scope } }
  )
  if (error) throw error
  const result = data ?? {}
  return {
    exportId: result?.exportId ?? '',
    status: result?.status ?? 'Pending',
  }
}

/** Request account deletion */
export async function requestAccountDeletion(reason?: string): Promise<{ requestId: string; status: string }> {
  if (API_BASE) {
    const res = await api.post<{ requestId?: string; status?: string }>('/privacy/delete/request', {
      reason,
    })
    return {
      requestId: res?.requestId ?? '',
      status: res?.status ?? 'received',
    }
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  const { data, error } = await supabase.functions.invoke<{ requestId?: string; status?: string }>(
    'privacy-delete',
    { body: { reason } }
  )
  if (error) throw error
  const result = data ?? {}
  return {
    requestId: result?.requestId ?? '',
    status: result?.status ?? 'Pending',
  }
}

/** Fetch user's privacy requests */
export async function fetchPrivacyRequests(type?: 'export' | 'delete'): Promise<PrivacyRequest[]> {
  if (API_BASE) {
    const path = type ? `/privacy/requests?type=${type}` : '/privacy/requests'
    const res = await api.get<{ requests?: PrivacyRequest[] }>(path)
    return Array.isArray(res?.requests) ? res.requests : []
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return []
  const fnUrl = `${import.meta.env.VITE_SUPABASE_URL ?? ''}/functions/v1/privacy-requests${type ? `?type=${type}` : ''}`
  const res = await fetch(fnUrl, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json().catch(() => ({})) as { requests?: PrivacyRequest[] }
  if (!res.ok) return []
  return Array.isArray(data?.requests) ? data.requests : []
}

/** Admin: fetch all privacy requests */
export async function fetchAdminPrivacyRequests(filters?: {
  type?: 'export' | 'delete'
  status?: string
  userId?: string
}): Promise<PrivacyRequest[]> {
  const params = new URLSearchParams()
  if (filters?.type) params.set('type', filters.type)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.userId) params.set('userId', filters.userId)
  const qs = params.toString()
  const url = qs ? `?${qs}` : ''
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  const fnUrl = `${import.meta.env.VITE_SUPABASE_URL ?? ''}/functions/v1/privacy-admin-requests${url}`
  const res = await fetch(fnUrl, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error('Failed to fetch admin requests')
  const data = (await res.json().catch(() => ({}))) as { requests?: PrivacyRequest[] }
  return Array.isArray(data?.requests) ? data.requests : []
}

/** Admin: approve, reject, confirm-export, schedule-delete */
export async function adminPrivacyAction(
  action: 'approve' | 'reject' | 'confirm-export' | 'schedule-delete',
  requestId: string,
  options?: { notes?: string; retentionWindowDays?: number }
): Promise<{ success: boolean; status?: string; downloadUrl?: string }> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  const { data, error } = await supabase.functions.invoke<{
    success?: boolean
    status?: string
    downloadUrl?: string
  }>('privacy-admin-action', {
    body: {
      action,
      requestId,
      notes: options?.notes,
      retentionWindowDays: options?.retentionWindowDays ?? 30,
    },
  })
  if (error) throw error
  const result = data ?? {}
  return {
    success: result?.success ?? false,
    status: result?.status,
    downloadUrl: result?.downloadUrl,
  }
}

/** Admin: fetch audit logs (concierge only - uses RLS) */
export async function fetchAuditLogs(filters?: {
  actionType?: string
  dateFrom?: string
  dateTo?: string
  userId?: string
  limit?: number
}): Promise<AuditLogEntry[]> {
  let query = supabase
    .from('audit_logs')
    .select('id, actor_user_id, action_type, resource, resource_id, description, timestamp, details')
    .eq('resource', 'privacy_request')
    .order('timestamp', { ascending: false })
    .limit(filters?.limit ?? 500)
  if (filters?.actionType) {
    query = query.eq('action_type', filters.actionType)
  }
  if (filters?.dateFrom) {
    query = query.gte('timestamp', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('timestamp', filters.dateTo)
  }
  const { data, error } = await query
  if (error) throw error
  const list = Array.isArray(data) ? data : []
  return list.map((r: Record<string, unknown>) => {
    const details = (r.details as Record<string, unknown>) ?? {}
    const actorId = r.actor_user_id
    const resourceVal = r.resource
    const resourceIdVal = r.resource_id
    const desc = (r.description ?? details.description) as string | undefined
    return {
      id: String(r.id ?? ''),
      actorUserId: actorId != null ? String(actorId) : null,
      actionType: String(r.action_type ?? ''),
      resource: resourceVal != null ? String(resourceVal) : null,
      resourceId: resourceIdVal != null ? String(resourceIdVal) : null,
      description: desc != null ? String(desc) : null,
      timestamp: String(r.timestamp ?? ''),
      details,
    }
  })
}

/** Fetch user preferences */
export async function fetchPreferences(): Promise<UserPreferences | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (error || !data) {
      return {
        notifyEmail: true,
        notifyPush: false,
        dataSharingOptOut: false,
        adPersonalizationOptOut: false,
        privacySettings: [],
      }
    }
    const d = data as Record<string, unknown>
    return {
      notifyEmail: d?.notify_email !== false,
      notifyPush: d?.notify_push === true,
      dataSharingOptOut: d?.data_sharing_opt_out === true,
      adPersonalizationOptOut: d?.ad_personalization_opt_out === true,
      privacySettings: Array.isArray(d?.privacy_settings) ? (d.privacy_settings as string[]) : [],
    }
  } catch {
    return null
  }
}

/** Update user preferences */
export async function updatePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const payload = {
    user_id: user.id,
    notify_email: prefs.notifyEmail ?? true,
    notify_push: prefs.notifyPush ?? false,
    data_sharing_opt_out: prefs.dataSharingOptOut ?? false,
    ad_personalization_opt_out: prefs.adPersonalizationOptOut ?? false,
    privacy_settings: prefs.privacySettings ?? [],
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('user_preferences').upsert(payload, {
    onConflict: 'user_id',
  })
  if (error) throw error
  return fetchPreferences()
}
