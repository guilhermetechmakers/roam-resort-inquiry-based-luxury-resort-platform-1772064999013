/**
 * Audit Log - Supabase Edge Function
 * POST /functions/v1/audit-log
 * Persists audit events. Called by client or other Edge Functions.
 * Requires: Authorization Bearer (Supabase JWT) or service role
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_ACTIONS = new Set([
  'login_attempt', 'login_success', 'login_failure',
  'signup_attempt', 'signup_success', 'signup_failure',
  'password_reset_request', 'password_reset_success', 'password_reset_failure',
  'logout', 'session_created', 'session_revoked', 'session_revoke_all',
  'inquiry_export', 'status_changed', 'user_status_changed', 'payment_state_changed',
])

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

  try {
    const body = (await req.json().catch(() => ({}))) as {
      action_type: string
      resource?: string
      resource_id?: string
      success?: boolean
      details?: Record<string, unknown>
    }

    const actionType = String(body?.action_type ?? '').trim()
    if (!actionType || !ALLOWED_ACTIONS.has(actionType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resource = body?.resource ? String(body.resource).slice(0, 100) : null
    const resourceId = body?.resource_id ? String(body.resource_id).slice(0, 255) : null
    const success = body?.success !== false
    const details = body?.details && typeof body.details === 'object' ? body.details : {}

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const authHeader = req.headers.get('Authorization')

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseKey)

    let actorUserId: string | null = null
    if (authHeader?.startsWith('Bearer ')) {
      const userSupabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const { data: { user } } = await userSupabase.auth.getUser()
      actorUserId = user?.id ?? null
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
    const userAgent = req.headers.get('user-agent') ?? ''

    const { error } = await supabase.from('audit_logs').insert({
      actor_user_id: actorUserId,
      action_type: actionType,
      resource,
      resource_id: resourceId,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      success,
      details,
    })

    if (error) {
      console.error('audit-log insert error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to write audit log' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ ok: true }),
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
