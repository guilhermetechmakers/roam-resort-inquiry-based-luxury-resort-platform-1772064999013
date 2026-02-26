/**
 * Audit Export - Supabase Edge Function
 * POST /functions/v1/audit-export
 * Returns audit logs as CSV for concierge. Requires concierge role.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function escapeCsv(val: unknown): string {
  if (val == null) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
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
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (profile as { role?: string } | null)?.role ?? ''
    if (role !== 'concierge') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - concierge role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = req.method === 'POST' ? (await req.json().catch(() => ({}))) as Record<string, unknown> : {}
    const actionType = body?.action_type ? String(body.action_type) : null
    const dateFrom = body?.date_from ? String(body.date_from) : null
    const dateTo = body?.date_to ? String(body.date_to) : null
    const limit = Math.min(Math.max(Number(body?.limit) || 1000, 1), 10000)

    const adminClient = createClient(supabaseUrl, supabaseKey)
    let query = adminClient
      .from('audit_logs')
      .select('id, actor_user_id, action_type, resource, resource_id, timestamp, ip_address, user_agent, success, details')
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (actionType) {
      query = query.eq('action_type', actionType)
    }
    if (dateFrom) {
      query = query.gte('timestamp', dateFrom)
    }
    if (dateTo) {
      query = query.lte('timestamp', dateTo)
    }

    const { data: rows, error } = await query

    if (error) {
      console.error('audit-export query error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch audit logs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const list = Array.isArray(rows) ? rows : []
    const headers = ['id', 'actor_user_id', 'action_type', 'resource', 'resource_id', 'timestamp', 'ip_address', 'user_agent', 'success', 'details']
    const csvRows = list.map((r: Record<string, unknown>) =>
      headers.map((h) => escapeCsv(r[h])).join(',')
    )
    const csv = [headers.join(','), ...csvRows].join('\n')

    const filename = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Internal server error'
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
