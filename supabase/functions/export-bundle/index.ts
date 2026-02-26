/**
 * Export Bundle - Supabase Edge Function
 * GET /functions/v1/export-bundle?token=xxx
 * Secure token-based bundle retrieval. Returns download URL or redirect.
 * Requires: Valid token (no auth required - token is the auth).
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
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: bundle, error } = await supabase
      .from('export_bundles')
      .select('id, request_id, path, status, expires_at')
      .eq('token', token)
      .single()

    if (error || !bundle) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const status = bundle.status as string
    const expiresAt = bundle.expires_at as string
    if (status !== 'ready' || new Date(expiresAt) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Bundle expired or not ready' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return placeholder URL - in production, generate signed URL from storage
    const downloadUrl = `${supabaseUrl}/storage/v1/object/public/exports/${bundle.request_id}.zip`
    return new Response(
      JSON.stringify({ downloadUrl, expiresAt }),
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
