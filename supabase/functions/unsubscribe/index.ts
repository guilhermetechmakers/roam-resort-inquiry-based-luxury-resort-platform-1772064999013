/**
 * Unsubscribe - Supabase Edge Function
 * POST /functions/v1/unsubscribe
 * Adds email to suppression list and/or updates user email preferences.
 * Public endpoint - no auth required for email-based unsubscribe.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UnsubscribeBody {
  email?: string
  userId?: string
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = (await req.json().catch(() => ({}))) as UnsubscribeBody
    const email = String(body.email ?? '').trim().toLowerCase()
    const userId = body.userId ?? null

    if (!email && !userId) {
      return new Response(
        JSON.stringify({ error: 'Email or userId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const { data: existing } = await supabase
        .from('suppression_list')
        .select('id')
        .ilike('email', email)
        .limit(1)
        .maybeSingle()

      if (!existing) {
        await supabase.from('suppression_list').insert({
          email,
          reason: 'User unsubscribe',
          source: 'manual',
        })
      }
    }

    if (userId) {
      await supabase.from('user_email_preferences').upsert(
        {
          user_id: userId,
          unsubscribed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    }

    return new Response(
      JSON.stringify({ ok: true, message: 'Unsubscribed successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('unsubscribe error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
