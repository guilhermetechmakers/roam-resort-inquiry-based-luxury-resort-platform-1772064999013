/**
 * Email Templates API
 * CRUD via Supabase. Concierge role required.
 */

import { supabase } from '@/lib/supabase'
import type { EmailTemplate, EmailTemplateVersion } from '@/types/email'

export async function fetchEmailTemplates(params?: {
  locale?: string
  status?: string
}): Promise<EmailTemplate[]> {
  let q = supabase
    .from('email_templates')
    .select('*')
    .order('name', { ascending: true })

  if (params?.locale && params.locale !== 'all') {
    q = q.eq('locale', params.locale)
  }
  if (params?.status && params.status !== 'all') {
    q = q.eq('status', params.status)
  }

  const { data, error } = await q
  if (error) throw error
  const list = Array.isArray(data) ? data : []
  return list.map((row) => ({
    id: row.id,
    name: row.name ?? '',
    slug: row.slug ?? '',
    locale: row.locale ?? 'en',
    version: row.version ?? 1,
    status: (row.status ?? 'draft') as EmailTemplate['status'],
    subject: row.subject ?? '',
    html_body: row.html_body ?? '',
    text_body: row.text_body ?? null,
    substitutions_schema: (row.substitutions_schema ?? {}) as EmailTemplate['substitutions_schema'],
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
    created_by: row.created_by ?? null,
    updated_by: row.updated_by ?? null,
  }))
}

export async function fetchEmailTemplateById(id: string): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    name: data.name ?? '',
    slug: data.slug ?? '',
    locale: data.locale ?? 'en',
    version: data.version ?? 1,
    status: (data.status ?? 'draft') as EmailTemplate['status'],
    subject: data.subject ?? '',
    html_body: data.html_body ?? '',
    text_body: data.text_body ?? null,
    substitutions_schema: (data.substitutions_schema ?? {}) as Record<string, string>,
    created_at: data.created_at ?? '',
    updated_at: data.updated_at ?? '',
    created_by: data.created_by ?? null,
    updated_by: data.updated_by ?? null,
  }
}

export async function fetchEmailTemplateBySlug(slug: string): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  return {
    id: data.id,
    name: data.name ?? '',
    slug: data.slug ?? '',
    locale: data.locale ?? 'en',
    version: data.version ?? 1,
    status: (data.status ?? 'draft') as EmailTemplate['status'],
    subject: data.subject ?? '',
    html_body: data.html_body ?? '',
    text_body: data.text_body ?? null,
    substitutions_schema: (data.substitutions_schema ?? {}) as Record<string, string>,
    created_at: data.created_at ?? '',
    updated_at: data.updated_at ?? '',
    created_by: data.created_by ?? null,
    updated_by: data.updated_by ?? null,
  }
}

export async function fetchTemplateVersions(templateId: string): Promise<EmailTemplateVersion[]> {
  const { data, error } = await supabase
    .from('email_template_versions')
    .select('*')
    .eq('template_id', templateId)
    .order('version', { ascending: false })

  if (error) throw error
  const list = Array.isArray(data) ? data : []
  return list.map((row) => ({
    id: row.id,
    template_id: row.template_id,
    version: row.version ?? 0,
    subject: row.subject ?? '',
    html_body: row.html_body ?? '',
    text_body: row.text_body ?? null,
    substitutions_schema: (row.substitutions_schema ?? {}) as EmailTemplate['substitutions_schema'],
    created_at: row.created_at ?? '',
    author: row.author ?? null,
  }))
}

export interface CreateEmailTemplatePayload {
  name: string
  slug?: string
  locale?: string
  subject: string
  html_body: string
  text_body?: string
  substitutions_schema?: Record<string, string> | { key: string; required?: boolean }[]
}

export async function createEmailTemplate(
  payload: CreateEmailTemplatePayload
): Promise<EmailTemplate> {
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id ?? null
  const slug = payload.slug ?? payload.name.replace(/\s+/g, '_').toLowerCase()

  const { data, error } = await supabase
    .from('email_templates')
    .insert({
      name: payload.name,
      slug,
      locale: payload.locale ?? 'en',
      subject: payload.subject,
      html_body: payload.html_body,
      text_body: payload.text_body ?? null,
      substitutions_schema: payload.substitutions_schema ?? {},
      status: 'draft',
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  const row = data ?? {}
  return {
    id: row.id,
    name: row.name ?? '',
    slug: row.slug ?? '',
    locale: row.locale ?? 'en',
    version: row.version ?? 1,
    status: (row.status ?? 'draft') as EmailTemplate['status'],
    subject: row.subject ?? '',
    html_body: row.html_body ?? '',
    text_body: row.text_body ?? null,
    substitutions_schema: (row.substitutions_schema ?? {}) as EmailTemplate['substitutions_schema'],
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
    created_by: row.created_by ?? null,
    updated_by: row.updated_by ?? null,
  }
}

export interface UpdateEmailTemplatePayload {
  name?: string
  subject?: string
  html_body?: string
  text_body?: string
  substitutions_schema?: Record<string, string>
}

export async function updateEmailTemplate(
  id: string,
  payload: UpdateEmailTemplatePayload
): Promise<EmailTemplate> {
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id ?? null

  const { data, error } = await supabase
    .from('email_templates')
    .update({
      ...payload,
      updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  const row = data ?? {}
  return {
    id: row.id,
    name: row.name ?? '',
    slug: row.slug ?? '',
    locale: row.locale ?? 'en',
    version: row.version ?? 1,
    status: (row.status ?? 'draft') as EmailTemplate['status'],
    subject: row.subject ?? '',
    html_body: row.html_body ?? '',
    text_body: row.text_body ?? null,
    substitutions_schema: (row.substitutions_schema ?? {}) as EmailTemplate['substitutions_schema'],
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
    created_by: row.created_by ?? null,
    updated_by: row.updated_by ?? null,
  }
}

export async function publishEmailTemplate(id: string): Promise<EmailTemplate> {
  return updateEmailTemplate(id, {})
    .then(async (t) => {
      const { data, error } = await supabase
        .from('email_templates')
        .update({ status: 'published' })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      const row = data ?? {}
      return {
        ...t,
        status: 'published' as const,
        subject: row.subject ?? t.subject,
        html_body: row.html_body ?? t.html_body,
        text_body: row.text_body ?? t.text_body,
      }
    })
}

export async function archiveEmailTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('email_templates')
    .update({ status: 'archived' })
    .eq('id', id)
  if (error) throw error
}

/** Preview template by id with payload (client-side substitution) */
export async function previewEmailTemplate(
  id: string,
  payload?: Record<string, string>
): Promise<{ subject: string; html_body: string; text_body: string }> {
  const template = await fetchEmailTemplateById(id)
  if (!template) throw new Error('Template not found')
  const sub = (s: string) =>
    String(s ?? '').replace(/\{\{(\w+)\}\}/g, (_, key) =>
      (payload ?? {})[key] ?? `{{${key}}}`
    )
  return {
    subject: sub(template.subject),
    html_body: sub(template.html_body),
    text_body: sub(template.text_body ?? ''),
  }
}

/** Send test email via email-send Edge Function */
export async function sendTestEmail(
  templateId: string,
  to: string,
  payload?: Record<string, string>
): Promise<{ jobId: string }> {
  const template = await fetchEmailTemplateById(templateId)
  if (!template) throw new Error('Template not found')
  const { sendEmail } = await import('@/api/email-jobs')
  const res = await sendEmail({
    templateName: template.name,
    to,
    payload: (payload ?? {}) as Record<string, string>,
    locale: template.locale,
  })
  return { jobId: res.jobId ?? '' }
}

/** Render template with payload (client-side substitution) */
export function renderTemplate(
  subject: string,
  htmlBody: string,
  textBody: string | null,
  payload: Record<string, string>
): { subject: string; htmlBody: string; textBody: string } {
  const sub = (s: string) =>
    s.replace(/\{\{(\w+)\}\}/g, (_, key) => payload[key] ?? `{{${key}}}`)
  return {
    subject: sub(subject),
    htmlBody: sub(htmlBody),
    textBody: textBody ? sub(textBody) : '',
  }
}
