/**
 * Privacy Requests - Supabase Edge Function
 * GET /functions/v1/privacy-requests?type=export|delete
 * Returns the authenticated user's privacy request history (export/deletion).
 * Requires: Authorization Bearer token (Supabase session).
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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const typeFilter = url.searchParams.get('type')

    let requests: Array<{
      id: string
      type: string
      status: string
      createdAt: string
      updatedAt: string
      downloadUrl?: string
    }> = []

    try {
      let query = supabase
        .from('privacy_requests')
        .select('id, type, status, requested_at, completed_at, download_url')
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false })

      if (typeFilter === 'export' || typeFilter === 'delete') {
        query = query.eq('type', typeFilter)
      }

      const { data, error } = await query
      if (!error && Array.isArray(data)) {
        requests = data.map((r: Record<string, unknown>) => ({
          id: String(r.id ?? ''),
          type: String(r.type ?? ''),
          status: mapStatus(String(r.status ?? '')),
          createdAt: String(r.requested_at ?? ''),
          updatedAt: String(r.completed_at ?? r.requested_at ?? ''),
          downloadUrl: r.download_url ? String(r.download_url) : undefined,
        }))
      }
    } catch {
      // Table may not exist - return empty array
    }

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

function mapStatus(s: string): string {
  return s || 'Pending'
}
