/**
 * Create Stripe Payment Link - Supabase Edge Function
 * Integrates with Stripe API to create payment links for inquiry deposits.
 * Endpoint: POST /functions/v1/create-stripe-payment-link
 * Body: { inquiryId, amount, items?, notes? }
 * Required secret: STRIPE_SECRET_KEY (set via supabase secrets set STRIPE_SECRET_KEY sk_xxx)
 *
 * Never expose Stripe secret key to the client.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LineItem {
  name?: string
  quantity?: number
  unitPrice?: number
  description?: string
}

interface RequestBody {
  inquiryId?: string
  amount?: number
  items?: LineItem[]
  notes?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = (await req.json().catch(() => ({}))) as RequestBody
    const inquiryId = body.inquiryId ?? ''
    const amount = typeof body.amount === 'number' ? body.amount : parseFloat(String(body.amount ?? 0))
    const items = Array.isArray(body.items) ? body.items : []
    const notes = typeof body.notes === 'string' ? body.notes : ''

    if (!inquiryId || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Valid inquiryId and amount > 0 required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured. Set STRIPE_SECRET_KEY.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const lineItems = items.length > 0
      ? items.map((i) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: i.name ?? 'Deposit',
              description: i.description ?? undefined,
            },
            unit_amount: Math.round((i.unitPrice ?? 0) * 100),
          },
          quantity: i.quantity ?? 1,
        }))
      : [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Deposit',
                description: notes || `Inquiry ${inquiryId}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ]

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': 'Deposit',
        'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': `${Deno.env.get('SITE_URL') ?? 'https://example.com'}/checkout/complete/${inquiryId}?session_id={CHECKOUT_SESSION_ID}&status=success`,
        'cancel_url': `${Deno.env.get('SITE_URL') ?? 'https://example.com'}/checkout/bridge/${inquiryId}?status=cancelled`,
        'metadata[inquiry_id]': inquiryId,
      }),
    })

    const sessionData = await res.json().catch(() => ({})) as { id?: string; url?: string; error?: { message?: string } }
    if (sessionData.error) {
      return new Response(
        JSON.stringify({ error: sessionData.error.message ?? 'Stripe error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paymentLinkUrl = sessionData.url ?? ''
    const sessionId = sessionData.id ?? ''

    if (!paymentLinkUrl) {
      return new Response(
        JSON.stringify({ error: 'Failed to create payment link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let paymentId = ''
    const { data: paymentRow } = await supabase
      .from('inquiry_payments')
      .insert({
        inquiry_id: inquiryId,
        stripe_link_url: paymentLinkUrl,
        stripe_session_id: sessionId,
        amount,
        currency: 'USD',
        status: 'link_created',
      })
      .select('id')
      .single()
    paymentId = paymentRow?.id ?? ''

    return new Response(
      JSON.stringify({
        paymentLinkUrl,
        paymentId,
      }),
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
