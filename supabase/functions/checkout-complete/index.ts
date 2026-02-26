/**
 * Checkout Complete - Supabase Edge Function
 * Public endpoint to fetch payment status for the checkout completion page.
 * GET /functions/v1/checkout-complete?inquiryId=xxx&session_id=xxx
 * Returns: inquiryId, paymentState, status, paymentLinkUrl.
 * No auth required - used after Stripe redirect.
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

  try {
    const url = new URL(req.url)
    const inquiryId = url.searchParams.get('inquiryId') ?? ''
    const sessionId = url.searchParams.get('session_id') ?? url.searchParams.get('sessionId') ?? ''
    const statusParam = url.searchParams.get('status') ?? ''

    if (!inquiryId) {
      return new Response(
        JSON.stringify({ error: 'inquiryId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .select('id, reference, payment_link, payment_state, status')
      .eq('id', inquiryId)
      .single()

    if (error || !inquiry) {
      return new Response(
        JSON.stringify({ error: 'Inquiry not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paymentState = inquiry.payment_state ?? 'pending'
    const status =
      statusParam === 'success' || paymentState === 'paid'
        ? 'success'
        : statusParam === 'cancelled' || statusParam === 'canceled'
          ? 'cancelled'
          : statusParam === 'failed' || statusParam === 'error'
            ? 'failed'
            : paymentState === 'paid'
              ? 'success'
              : 'pending'

    const payload = {
      inquiryId: inquiry.id,
      paymentState,
      status,
      paymentLinkUrl: inquiry.payment_link ?? null,
      stripeSessionId: sessionId || null,
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Internal server error'
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
