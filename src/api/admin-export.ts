/**
 * Admin CSV Export API client.
 * Integrates with admin-export Supabase Edge Function.
 */

import { supabase } from '@/lib/supabase'
import type {
  ExportJob,
  ExportFieldOption,
  HostOption,
  CreateExportPayload,
} from '@/types/export'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''

function getFunctionsUrl(path: string, params?: Record<string, string>): string {
  const base = `${SUPABASE_URL}/functions/v1/admin-export`
  const url = new URL(path, base)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  return url.toString()
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (session?.access_token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`
  }
  return headers
}

/** Fetch export definitions (datasets, default mappings, example headers) */
export async function fetchExportDefinitions(): Promise<{
  datasets: Array<{ id: string; label: string }>
  defaultMappings: Record<string, string[]>
  exampleHeaders: Record<string, string[]>
}> {
  const url = getFunctionsUrl('', { definitions: '1' })
  const headers = await getAuthHeaders()
  const res = await fetch(url, { method: 'GET', headers })
  const data = (await res.json().catch(() => ({}))) as {
    datasets?: Array<{ id: string; label: string }>
    defaultMappings?: Record<string, string[]>
    exampleHeaders?: Record<string, string[]>
    error?: string
  }
  if (!res.ok) throw new Error(data?.error ?? 'Failed to fetch definitions')
  return {
    datasets: Array.isArray(data?.datasets) ? data.datasets : [],
    defaultMappings: data?.defaultMappings ?? {},
    exampleHeaders: data?.exampleHeaders ?? {},
  }
}

/** Fetch available fields for a dataset */
export async function fetchFieldOptions(
  dataset: 'inquiries' | 'reconciliation'
): Promise<ExportFieldOption[]> {
  const url = getFunctionsUrl('', { dataset })
  const headers = await getAuthHeaders()
  const res = await fetch(url, { method: 'GET', headers })
  const data = (await res.json().catch(() => ({}))) as { fields?: ExportFieldOption[]; error?: string }
  if (!res.ok) throw new Error(data?.error ?? 'Failed to fetch fields')
  const fields = Array.isArray(data?.fields) ? data.fields : []
  return fields
}

/** Fetch hosts/destinations for filters */
export async function fetchHosts(): Promise<HostOption[]> {
  const url = getFunctionsUrl('', { list: 'hosts' })
  const headers = await getAuthHeaders()
  const res = await fetch(url, { method: 'GET', headers })
  const data = (await res.json().catch(() => ({}))) as { hosts?: HostOption[]; error?: string }
  if (!res.ok) throw new Error(data?.error ?? 'Failed to fetch hosts')
  const hosts = Array.isArray(data?.hosts) ? data.hosts : []
  return hosts
}

/** Create export job */
export async function createExportJob(payload: CreateExportPayload): Promise<{ id: string }> {
  const url = getFunctionsUrl('')
  const headers = await getAuthHeaders()
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      dataset: payload.dataset,
      fields: payload.fields ?? [],
      dateFrom: payload.dateFrom,
      dateTo: payload.dateTo,
      filters: payload.filters ?? {},
      delimiter: payload.delimiter ?? ',',
      includeHeaders: payload.includeHeaders ?? true,
    }),
  })
  const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string }
  if (!res.ok) throw new Error(data?.error ?? 'Failed to create export')
  return { id: data.id ?? '' }
}

/** Fetch list of export jobs */
export async function fetchExports(limit?: number): Promise<ExportJob[]> {
  const params: Record<string, string> = { list: 'jobs' }
  if (limit != null) params.limit = String(limit)
  const url = getFunctionsUrl('', params)
  const headers = await getAuthHeaders()
  const res = await fetch(url, { method: 'GET', headers })
  const data = (await res.json().catch(() => ({}))) as { exports?: ExportJob[]; error?: string }
  if (!res.ok) throw new Error(data?.error ?? 'Failed to fetch exports')
  const exports = Array.isArray(data?.exports) ? data.exports : []
  return exports
}

/** Fetch single export job status */
export async function fetchExportStatus(exportId: string): Promise<ExportJob | null> {
  const url = getFunctionsUrl('', { id: exportId })
  const headers = await getAuthHeaders()
  const res = await fetch(url, { method: 'GET', headers })
  const data = (await res.json().catch(() => ({}))) as ExportJob & { error?: string }
  if (!res.ok) return null
  return data as ExportJob
}

/** Get signed download URL for completed export */
export async function fetchDownloadUrl(exportId: string): Promise<string | null> {
  const url = getFunctionsUrl('', { id: exportId, download: '1' })
  const headers = await getAuthHeaders()
  const res = await fetch(url, { method: 'GET', headers })
  const data = (await res.json().catch(() => ({}))) as { downloadUrl?: string; error?: string }
  if (!res.ok) return null
  return data?.downloadUrl ?? null
}

/** Retry failed export */
export async function retryExport(exportId: string): Promise<void> {
  const url = getFunctionsUrl('')
  const headers = await getAuthHeaders()
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id: exportId, action: 'retry' }),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(data?.error ?? 'Failed to retry')
}

/** Cancel queued or processing export */
export async function cancelExport(exportId: string): Promise<void> {
  const url = getFunctionsUrl('')
  const headers = await getAuthHeaders()
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id: exportId, action: 'cancel' }),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(data?.error ?? 'Failed to cancel')
}
