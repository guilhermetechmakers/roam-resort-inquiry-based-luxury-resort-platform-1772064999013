/**
 * Privacy Audit Logs - Supabase Edge Function
 * GET /functions/v1/privacy-audit-logs
 * Returns audit logs with filters (type, date range, userId, action).
 * Requires: Authorization Bearer token with concierge role.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const role = (user.user_metadata?.role ?? user.app_metadata?.role) as string | undefined
    const isConcierge = role === 'concierge' || role === 'admin' || role === 'Concierge' || role === 'Admin'
    if (!isConcierge) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const actionType = url.searchParams.get('actionType')
    const userId = url.searchParams.get('userId')
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100', 10), 500)

    let query = supabase
      .from('audit_logs')
      .select('id, actor_user_id, action_type, resource_id, timestamp, details')
      .eq('resource', 'privacy_request')
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (actionType) query = query.eq('action_type', actionType)
    if (userId) query = query.eq('actor_user_id', userId)
    if (from) query = query.gte('timestamp', from)
    if (to) query = query.lte('timestamp', to)

    const { data, error } = await query
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const logs = (Array.isArray(data) ? data : []).map((r: Record<string, unknown>) => ({
      id: r.id,
      userId: r.actor_user_id,
      actionType: r.action_type,
      targetId: r.resource_id,
      description: (r.details as Record<string, unknown>)?.description ?? '',
      metadata: (r.details as Record<string, unknown>) ?? {},
      createdAt: r.timestamp,
    }))
    return new Response(
      JSON.stringify({ logs }),
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
