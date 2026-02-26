/**
 * Email Jobs & Suppression API
 * Fetches via Supabase (RLS) for concierge.
 */

import { supabase } from '@/lib/supabase'
import type { EmailJob, SuppressionEntry } from '@/types/email'

/** Fetch email jobs with optional status filter */
export async function fetchEmailJobs(params?: {
  status?: string
  limit?: number
}): Promise<EmailJob[]> {
  let q = supabase
    .from('email_jobs')
    .select('*')
    .order('created_at', { ascending: false })

  if (params?.status && params.status !== 'all') {
    q = q.eq('status', params.status)
  }
  const limit = Math.min(params?.limit ?? 50, 100)
  q = q.limit(limit)

  const { data, error } = await q
  if (error) throw error
  const list = Array.isArray(data) ? data : []
  return list.map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ''),
    template_id: (row.template_id as string) ?? null,
    template_slug: (row.template_slug as string) ?? null,
    payload: (row.payload as Record<string, unknown>) ?? {},
    to: String(row.to ?? ''),
    from: (row.from as string) ?? null,
    status: String(row.status ?? 'queued') as EmailJob['status'],
    attempts: Number(row.attempts ?? 0),
    max_attempts: Number(row.max_attempts ?? 5),
    next_attempt: (row.next_attempt as string) ?? null,
    last_error: (row.last_error as string) ?? null,
    sendgrid_message_id: (row.sendgrid_message_id as string) ?? null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  }))
}

/** Fetch single job by id */
export async function fetchEmailJobById(id: string): Promise<EmailJob | null> {
  const { data, error } = await supabase
    .from('email_jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  const d = data as Record<string, unknown>
  return {
    id: String(d.id ?? ''),
    template_id: (d.template_id as string) ?? null,
    template_slug: (d.template_slug as string) ?? null,
    payload: (d.payload as Record<string, unknown>) ?? {},
    to: String(d.to ?? ''),
    from: (d.from as string) ?? null,
    status: String(d.status ?? 'queued') as EmailJob['status'],
    attempts: Number(d.attempts ?? 0),
    max_attempts: Number(d.max_attempts ?? 5),
    next_attempt: (d.next_attempt as string) ?? null,
    last_error: (d.last_error as string) ?? null,
    sendgrid_message_id: (d.sendgrid_message_id as string) ?? null,
    created_at: String(d.created_at ?? ''),
    updated_at: String(d.updated_at ?? ''),
  }
}

/** Send email via Edge Function (concierge or service) */
export async function sendEmail(payload: import('@/types/email').EmailSendPayload): Promise<{ ok: boolean; jobId?: string }> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
  const body = {
    templateName: payload.templateName ?? payload.templateSlug,
    to: payload.to,
    payload: payload.payload ?? {},
    locale: payload.locale ?? 'en',
  }
  const res = await fetch(`${SUPABASE_URL}/functions/v1/email-send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const result = (await res.json().catch(() => ({}))) as { ok?: boolean; jobId?: string; error?: string }
  if (!res.ok) throw new Error(result.error ?? 'Failed to send email')
  return { ok: result.ok ?? false, jobId: result.jobId }
}

/** Fetch suppression list */
export async function fetchSuppressionList(params?: {
  limit?: number
}): Promise<SuppressionEntry[]> {
  const limit = Math.min(params?.limit ?? 100, 500)
  const { data, error } = await supabase
    .from('suppression_list')
    .select('*')
    .order('added_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  const list = Array.isArray(data) ? data : []
  return list.map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ''),
    email: String(row.email ?? ''),
    reason: (row.reason as string) ?? null,
    source: (row.source as string) ?? null,
    added_at: String(row.added_at ?? ''),
    expires_at: (row.expires_at as string) ?? null,
  }))
}
