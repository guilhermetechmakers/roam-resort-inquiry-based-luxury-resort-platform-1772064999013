/**
 * Privacy Admin Requests - Supabase Edge Function
 * GET /functions/v1/privacy-admin-requests
 * Returns all privacy requests for admin/staff review.
 * Requires: Authorization Bearer token with admin/concierge role.
 * Admin can update status, add notes, and export as CSV via the database.
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
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
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
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check admin role via user_metadata or a profiles/roles table
    const role = (user.user_metadata?.role ?? user.app_metadata?.role) as string | undefined
    const isAdmin = role === 'admin' || role === 'concierge' || role === 'Admin' || role === 'Concierge'
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden', message: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const typeFilter = url.searchParams.get('type')

    let query = supabase
      .from('privacy_requests')
      .select('id, user_id, type, status, requested_at, completed_at, download_url')
      .order('requested_at', { ascending: false })

    if (typeFilter === 'export' || typeFilter === 'delete') {
      query = query.eq('type', typeFilter)
    }

    const { data, error } = await query
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requests = Array.isArray(data)
      ? data.map((r: Record<string, unknown>) => ({
          id: r.id,
          userId: r.user_id,
          type: r.type,
          status: r.status,
          requestedAt: r.requested_at,
          completedAt: r.completed_at,
          downloadUrl: r.download_url,
        }))
      : []

    return new Response(
      JSON.stringify({ requests }),
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
