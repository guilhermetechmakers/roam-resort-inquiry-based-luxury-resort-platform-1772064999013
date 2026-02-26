/**
 * Email Process Queue - Supabase Edge Function
 * Processes queued email jobs, renders templates, sends via SendGrid.
 * Called by email-send or cron. Requires SENDGRID_API_KEY.
 */

const SENDGRID_URL = 'https://api.sendgrid.com/v3/mail/send'
const MAX_ATTEMPTS = 5
const BASE_DELAY_MS = 60_000

function renderTemplate(template: string, payload: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return payload[key] ?? `{{${key}}}`
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' },
    })
  }

  const apiKey = Deno.env.get('SENDGRID_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'SendGrid not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ') || authHeader !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data: jobs } = await adminClient
    .from('email_jobs')
    .select('*')
    .eq('status', 'queued')
    .lte('next_attempt', new Date().toISOString())
    .order('next_attempt', { ascending: true })
    .limit(10)

  const list = Array.isArray(jobs) ? jobs : []
  let processed = 0

  for (const job of list) {
    const j = job as {
      id: string
      template_id: string | null
      template_name: string | null
      payload: Record<string, string>
      to: string
      attempts: number
    }
    const payload = (j.payload && typeof j.payload === 'object') ? j.payload as Record<string, string> : {}

    const { data: suppressed } = await adminClient
      .from('suppression_list')
      .select('id')
      .eq('email', j.to.toLowerCase())
      .limit(1)

    if (Array.isArray(suppressed) && suppressed.length > 0) {
      await adminClient
        .from('email_jobs')
        .update( { status: 'suppressed', updated_at: new Date().toISOString() })
        .eq('id', j.id)
      processed++
      continue
    }

    let subject = ''
    let html = ''
    let text = ''

    if (j.template_id) {
      const { data: template } = await adminClient
        .from('email_templates')
        .select('subject, html_body, text_body')
        .eq('id', j.template_id)
        .eq('status', 'published')
        .single()

      if (template) {
        const t = template as { subject?: string; html_body?: string; text_body?: string }
        subject = renderTemplate(t.subject ?? '', payload)
        html = renderTemplate(t.html_body ?? '', payload)
        text = renderTemplate(t.text_body ?? '', payload)
      }
    }

    if (!subject && !html) {
      subject = `Message from Roam Resort`
      html = `<p>${Object.entries(payload).map(([k, v]) => `${k}: ${v}`).join('<br/>')}</p>`
      text = Object.entries(payload).map(([k, v]) => `${k}: ${v}`).join('\n')
    }

    await adminClient
      .from('email_jobs')
      .update({
        status: 'sending',
        attempts: (j.attempts ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', j.id)

    const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') ?? 'concierge@roamresort.com'
    const fromName = Deno.env.get('SENDGRID_FROM_NAME') ?? 'Roam Resort Concierge'

    const res = await fetch(SENDGRID_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: j.to }] }],
        from: { email: fromEmail, name: fromName },
        subject,
        content: [
          { type: 'text/html', value: html || text },
          ...(text ? [{ type: 'text/plain', value: text }] : []),
        ],
      }),
    })

    if (res.ok) {
      await adminClient
        .from('email_jobs')
        .update({
          status: 'delivered',
          last_error: null,
          next_attempt: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', j.id)

      await adminClient.from('email_delivery_events').insert({
        job_id: j.id,
        event_type: 'delivered',
        details: {},
      })
      processed++
    } else {
      const errText = await res.text()
      const attempts = (j.attempts ?? 0) + 1
      const nextStatus = attempts >= MAX_ATTEMPTS ? 'failed' : 'queued'
      const delay = BASE_DELAY_MS * Math.pow(2, attempts - 1)
      const nextAttempt = new Date(Date.now() + delay).toISOString()

      await adminClient
        .from('email_jobs')
        .update({
          status: nextStatus,
          last_error: errText.slice(0, 500),
          next_attempt: nextStatus === 'queued' ? nextAttempt : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', j.id)
      processed++
    }
  }

  return new Response(
    JSON.stringify({ processed, total: list.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
