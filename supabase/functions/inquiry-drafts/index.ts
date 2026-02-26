/**
 * Inquiry Drafts - Supabase Edge Function
 * Save and restore inquiry form drafts for authenticated users.
 * POST: save draft (body: { listing_id?, data })
 * GET: fetch draft (?listing_id=xxx or ?id=xxx)
 * PATCH: update draft (body: { id, data })
 * Required: Authorization Bearer token
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id

    if (req.method === 'GET') {
      const url = new URL(req.url)
      const listingId = url.searchParams.get('listing_id') ?? ''
      const draftId = url.searchParams.get('id') ?? ''

      let query = supabaseAdmin
        .from('inquiry_drafts')
        .select('*')
        .eq('user_id', userId)
        .eq('form_type', 'inquiry')
        .gt('expires_at', new Date().toISOString())

      if (draftId) {
        query = query.eq('id', draftId)
      } else if (listingId) {
        query = query.eq('listing_id', listingId)
      } else {
        query = query.order('last_saved_at', { ascending: false }).limit(1)
      }

      const { data, error } = await query.single()

      if (error && error.code !== 'PGRST116') {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!data) {
        return new Response(
          JSON.stringify({ draft: null }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          draft: {
            id: data.id,
            listing_id: data.listing_id,
            data: data.data ?? {},
            last_saved_at: data.last_saved_at,
            expires_at: data.expires_at,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const body = (await req.json().catch(() => ({}))) as { listing_id?: string; data?: Record<string, unknown> }
      const listingId = typeof body?.listing_id === 'string' ? body.listing_id : null
      const formData = body?.data && typeof body.data === 'object' ? body.data : {}

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      let existingQuery = supabaseAdmin
        .from('inquiry_drafts')
        .select('id')
        .eq('user_id', userId)
        .eq('form_type', 'inquiry')
      if (listingId) {
        existingQuery = existingQuery.eq('listing_id', listingId)
      } else {
        existingQuery = existingQuery.is('listing_id', null)
      }
      const { data: existing } = await existingQuery.maybeSingle()

      if (existing) {
        const { data: updated, error } = await supabaseAdmin
          .from('inquiry_drafts')
          .update({
            data: formData,
            last_saved_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({
            id: updated?.id,
            last_saved_at: updated?.last_saved_at,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: inserted, error } = await supabaseAdmin
        .from('inquiry_drafts')
        .insert({
          user_id: userId,
          listing_id: listingId,
          form_type: 'inquiry',
          data: formData,
          last_saved_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          id: inserted?.id,
          last_saved_at: inserted?.last_saved_at,
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'PATCH') {
      const body = (await req.json().catch(() => ({}))) as { id?: string; data?: Record<string, unknown> }
      const draftId = typeof body?.id === 'string' ? body.id : ''
      const formData = body?.data && typeof body.data === 'object' ? body.data : {}

      if (!draftId) {
        return new Response(
          JSON.stringify({ error: 'Draft id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { data: updated, error } = await supabaseAdmin
        .from('inquiry_drafts')
        .update({
          data: formData,
          last_saved_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', draftId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!updated) {
        return new Response(
          JSON.stringify({ error: 'Draft not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          id: updated.id,
          last_saved_at: updated.last_saved_at,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Internal server error'
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
