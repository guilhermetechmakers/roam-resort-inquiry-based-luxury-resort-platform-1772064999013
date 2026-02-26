/**
 * Session Revoke - Supabase Edge Function
 * POST /functions/v1/session-revoke
 * Revokes a single session or all sessions for the user.
 * Body: { sessionId?: string, revokeAll?: boolean }
 * Requires: Authorization Bearer (Supabase JWT)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
      sessionId?: string
      revokeAll?: boolean
    }
    const sessionId = body?.sessionId ? String(body.sessionId).trim() : null
    const revokeAll = !!body?.revokeAll

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

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
    const userAgent = req.headers.get('user-agent') ?? ''

    if (revokeAll) {
      const { data: updated, error: updateError } = await supabase
        .from('user_sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('revoked_at', null)
        .select('id')

      if (updateError) {
        console.error('session-revoke all error:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to revoke sessions' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      await supabase.from('audit_logs').insert({
        actor_user_id: user.id,
        action_type: 'session_revoke_all',
        resource: 'session',
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        success: true,
        details: { count: Array.isArray(updated) ? updated.length : 0 },
      }).then(() => {}).catch(() => {})

      return new Response(
        JSON.stringify({ ok: true, revoked: 'all' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'sessionId or revokeAll required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: updated, error: updateError } = await supabase
      .from('user_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .select('id')
      .single()

    if (updateError || !updated) {
      return new Response(
        JSON.stringify({ error: 'Session not found or already revoked' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabase.from('audit_logs').insert({
      actor_user_id: user.id,
      action_type: 'session_revoked',
      resource: 'session',
      resource_id: sessionId,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      success: true,
    }).then(() => {}).catch(() => {})

    return new Response(
      JSON.stringify({ ok: true, revoked: sessionId }),
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
