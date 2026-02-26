/**
 * Session Create - Supabase Edge Function
 * POST /functions/v1/session-create
 * Creates a user_sessions record after login. Called by client with auth header.
 * Requires: Authorization Bearer (Supabase JWT)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SESSION_TTL_MINUTES = 60 * 24 * 7 // 7 days

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Missing or invalid authorization' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      device_info?: string
      user_agent?: string
    }
    const deviceInfo = String(body?.device_info ?? '').slice(0, 500)
    const userAgent = String(body?.user_agent ?? req.headers.get('user-agent') ?? '').slice(0, 500)
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      ''

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + SESSION_TTL_MINUTES)

    const { data: inserted, error: insertError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        device_info: deviceInfo || (userAgent?.includes('Mobile') ? 'Mobile' : 'Desktop'),
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        expires_at: expiresAt.toISOString(),
      })
      .select('id, created_at, last_active_at')
      .single()

    if (insertError) {
      console.error('session-create insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      actor_user_id: user.id,
      action_type: 'session_created',
      resource: 'session',
      resource_id: inserted?.id ?? null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      success: true,
      details: { device_info: deviceInfo || null },
    }).then(() => {}).catch(() => {})

    return new Response(
      JSON.stringify({
        sessionId: inserted?.id,
        createdAt: inserted?.created_at,
        expiresAt: expiresAt.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Internal server error'
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
