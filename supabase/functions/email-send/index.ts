/**
 * Email Send - Supabase Edge Function
 * Enqueues email jobs for template-based sending.
 * Checks suppression list before enqueueing.
 * Required: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL (optional)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function ensureAuthorized(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (serviceKey && authHeader === `Bearer ${serviceKey}`) {
    return { userId: 'service' }
  }

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

  return { userId: user.id }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const auth = await ensureAuthorized(req)
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      templateName?: string
      to?: string
      payload?: Record<string, string>
      locale?: string
    }

    const templateName = String(body.templateName ?? '').trim()
    const to = String(body.to ?? '').trim()
    const payload = (body.payload && typeof body.payload === 'object') ? body.payload : {}
    const locale = String(body.locale ?? 'en').trim()

    if (!templateName || !to) {
      return new Response(JSON.stringify({ error: 'templateName and to required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: suppressed } = await adminClient
      .from('suppression_list')
      .select('id')
      .eq('email', to.toLowerCase())
      .limit(1)

    if (Array.isArray(suppressed) && suppressed.length > 0) {
      const { data: job } = await adminClient
        .from('email_jobs')
        .insert({
          template_name: templateName,
          payload: payload,
          to: to,
          status: 'suppressed',
          attempts: 0,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      return new Response(
        JSON.stringify({ jobId: (job as { id?: string })?.id ?? job, suppressed: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: template } = await adminClient
      .from('email_templates')
      .select('id')
      .eq('name', templateName)
      .eq('locale', locale)
      .eq('status', 'published')
      .single()

    const templateId = (template as { id?: string } | null)?.id ?? null

    const { data: job, error } = await adminClient
      .from('email_jobs')
      .insert({
        template_id: templateId,
        template_name: templateName,
        payload: payload,
        to: to,
        status: 'queued',
        attempts: 0,
        next_attempt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const jobId = (job as { id?: string })?.id
    if (!jobId) {
      return new Response(JSON.stringify({ error: 'Failed to create job' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const processUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/email-process-queue`
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    fetch(processUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({}),
    }).catch(() => {})

    return new Response(JSON.stringify({ jobId }), {
      status: 200,
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
