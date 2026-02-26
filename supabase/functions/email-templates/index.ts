/**
 * Email Templates - Supabase Edge Function
 * CRUD for email templates, preview, publish, versions.
 * Requires concierge role for all operations.
 * GET /email-templates, GET /email-templates/:id, POST /email-templates
 * PUT /email-templates/:id, POST /email-templates/:id/publish
 * POST /email-templates/:id/versions, GET /email-templates/:id/preview
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function renderTemplate(
  template: string,
  payload: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return payload[key] ?? `{{${key}}}`
  })
}

async function ensureConcierge(
  req: Request
): Promise<{ userId: string; supabase: Awaited<ReturnType<typeof createClient>> } | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !supabaseKey) return null

  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return null

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = (profile as { role?: string } | null)?.role ?? ''
  if (role !== 'concierge') return null

  return { userId: user.id, supabase }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const auth = await ensureConcierge(req)
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const pathMatch = url.pathname.match(/\/functions\/v1\/email-templates\/?(.*)/)
  const subPath = (pathMatch?.[1] ?? '').replace(/\/$/, '')
  const segments = subPath ? subPath.split('/') : []
  const id = segments[0] && segments[0] !== 'preview' ? segments[0] : null
  const action = segments[1] ?? (id ? null : 'list')

  const adminClient = await (async () => {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    return createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
  })()

  try {
    if (req.method === 'GET') {
      if (id && action === 'preview') {
        const payloadParam = url.searchParams.get('payload')
        const payload: Record<string, string> = payloadParam
          ? (JSON.parse(decodeURIComponent(payloadParam)) as Record<string, string>)
          : {}

        const { data: template, error } = await adminClient
          .from('email_templates')
          .select('*')
          .eq('id', id)
          .in('status', ['draft', 'published'])
          .single()

        if (error || !template) {
          return new Response(JSON.stringify({ error: 'Template not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const t = template as { subject?: string; html_body?: string; text_body?: string }
        const subject = renderTemplate(t.subject ?? '', payload)
        const html_body = renderTemplate(t.html_body ?? '', payload)
        const text_body = renderTemplate(t.text_body ?? '', payload)

        return new Response(
          JSON.stringify({ subject, html_body, text_body }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (id) {
        const { data: template, error } = await adminClient
          .from('email_templates')
          .select('*')
          .eq('id', id)
          .single()

        if (error || !template) {
          return new Response(JSON.stringify({ error: 'Template not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const t = template as Record<string, unknown>
        const schema = t.substitutions_schema
        if (Array.isArray(schema)) {
          t.substitutions_schema = schema
        } else {
          t.substitutions_schema = []
        }

        return new Response(JSON.stringify(template), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const locale = url.searchParams.get('locale') ?? undefined
      const status = url.searchParams.get('status') ?? undefined

      let query = adminClient.from('email_templates').select('*').order('name')
      if (locale) query = query.eq('locale', locale)
      if (status) query = query.eq('status', status)

      const { data: templates, error } = await query

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const list = Array.isArray(templates) ? templates : []
      return new Response(JSON.stringify({ templates: list }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'POST' && !id) {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
      const name = String(body.name ?? '').trim()
      const locale = String(body.locale ?? 'en').trim()
      const subject = String(body.subject ?? '').trim()
      const html_body = String(body.html_body ?? '').trim()
      const text_body = String(body.text_body ?? '').trim()
      const schema = Array.isArray(body.substitutions_schema)
        ? (body.substitutions_schema as { key: string; required?: boolean }[])
        : []

      if (!name || !subject) {
        return new Response(JSON.stringify({ error: 'Name and subject required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: inserted, error } = await adminClient
        .from('email_templates')
        .insert({
          name,
          locale,
          subject,
          html_body,
          text_body,
          substitutions_schema: schema,
          status: 'draft',
          created_by: auth.userId,
          updated_by: auth.userId,
        })
        .select('*')
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify(inserted), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'PUT' && id) {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        updated_by: auth.userId,
      }
      if (body.subject != null) updates.subject = String(body.subject).trim()
      if (body.html_body != null) updates.html_body = String(body.html_body).trim()
      if (body.text_body != null) updates.text_body = String(body.text_body).trim()
      if (Array.isArray(body.substitutions_schema)) {
        updates.substitutions_schema = body.substitutions_schema
      }

      const { data: updated, error } = await adminClient
        .from('email_templates')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify(updated), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'POST' && id && action === 'publish') {
      const { data: template, error: fetchErr } = await adminClient
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchErr || !template) {
        return new Response(JSON.stringify({ error: 'Template not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const t = template as { version?: number }
      const newVersion = (t.version ?? 1) + 1

      await adminClient.from('email_template_versions').insert({
        template_id: id,
        version: t.version ?? 1,
        subject: template.subject,
        html_body: template.html_body,
        text_body: template.text_body,
        substitutions_schema: template.substitutions_schema ?? [],
        author: auth.userId,
      })

      const { data: updated, error } = await adminClient
        .from('email_templates')
        .update({
          status: 'published',
          version: newVersion,
          updated_at: new Date().toISOString(),
          updated_by: auth.userId,
        })
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify(updated), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'POST' && id && action === 'versions') {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
      const { data: template, error: fetchErr } = await adminClient
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchErr || !template) {
        return new Response(JSON.stringify({ error: 'Template not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const t = template as { version?: number }
      const version = t.version ?? 1
      const subject = body.subject != null ? String(body.subject) : template.subject
      const html_body = body.html_body != null ? String(body.html_body) : template.html_body
      const text_body = body.text_body != null ? String(body.text_body) : template.text_body
      const schema = Array.isArray(body.substitutions_schema)
        ? body.substitutions_schema
        : template.substitutions_schema ?? []

      const { data: versionRow, error } = await adminClient
        .from('email_template_versions')
        .insert({
          template_id: id,
          version,
          subject,
          html_body,
          text_body,
          substitutions_schema: schema,
          author: auth.userId,
        })
        .select('*')
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify(versionRow), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Internal server error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
