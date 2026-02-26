/**
 * Stripe Webhook - Supabase Edge Function
 * Verifies Stripe signature, processes checkout.session.completed, payment_intent.succeeded,
 * payment_intent.payment_failed, checkout.session.async_payment_failed.
 * Updates inquiry status and inquiry_payments via Supabase.
 * Required secret: STRIPE_WEBHOOK_SECRET (set via supabase secrets set STRIPE_WEBHOOK_SECRET whsec_xxx)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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

  const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!stripeWebhookSecret) {
    return new Response(
      JSON.stringify({ error: 'Webhook secret not configured' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const signature = req.headers.get('stripe-signature') ?? ''
  const body = await req.text()

  let event: { type?: string; data?: { object?: Record<string, unknown> }; id?: string }
  try {
    const Stripe = (await import('https://esm.sh/stripe@14.21.0')).default
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? 'sk_placeholder')
    event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret) as typeof event
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Invalid signature'
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const eventType = event?.type ?? ''
  const obj = event?.data?.object ?? {}

  const getInquiryId = (): string | null => {
    const meta = obj?.metadata as Record<string, string> | undefined
    if (meta?.inquiry_id) return meta.inquiry_id
    return null
  }

  const getSessionId = (): string | null => {
    const id = obj?.id
    return typeof id === 'string' ? id : null
  }

  const logPaymentEvent = async (inquiryId: string, evtType: string, stripeEventId: string, payload: unknown): Promise<boolean> => {
    try {
      const { data: existing } = await supabase
        .from('payment_event_log')
        .select('id')
        .eq('stripe_event_id', stripeEventId)
        .maybeSingle()
      if (existing) return false
      const { error } = await supabase.from('payment_event_log').insert({
        inquiry_id: inquiryId,
        event_type: evtType,
        stripe_event_id: stripeEventId,
        payload: payload ?? {},
      })
      return !error
    } catch {
      return false
    }
  }

  const updateInquiryStatus = async (inquiryId: string, status: string, paymentState: string) => {
    const { error } = await supabase
      .from('inquiries')
      .update({
        status,
        payment_state: paymentState,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inquiryId)
    return !error
  }

  const markPaymentPaid = async (
    inquiryId: string,
    sessionId: string | null,
    amountCents?: number,
    currency?: string
  ) => {
    const now = new Date().toISOString()
    if (sessionId) {
      const { data: payments } = await supabase
        .from('inquiry_payments')
        .select('id')
        .eq('inquiry_id', inquiryId)
        .eq('stripe_session_id', sessionId)
      const list = Array.isArray(payments) ? payments : []
      if (list.length > 0 && list[0]?.id) {
        await supabase
          .from('inquiry_payments')
          .update({ status: 'paid', updated_at: now })
          .eq('id', list[0].id)
        return
      }
    }
    const { data: latest } = await supabase
      .from('inquiry_payments')
      .select('id')
      .eq('inquiry_id', inquiryId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (latest?.id) {
      await supabase
        .from('inquiry_payments')
        .update({ status: 'paid', updated_at: now })
        .eq('id', latest.id)
    } else if (amountCents != null && amountCents > 0) {
      await supabase.from('inquiry_payments').insert({
        inquiry_id: inquiryId,
        stripe_session_id: sessionId,
        amount: amountCents / 100,
        currency: (currency ?? 'usd').toUpperCase(),
        status: 'paid',
      })
    }
  }

  const stripeEventId = (event as { id?: string })?.id ?? ''

  try {
    switch (eventType) {
      case 'checkout.session.completed': {
        const inquiryId = getInquiryId()
        const sessionId = getSessionId()
        if (!inquiryId) break
        const isNew = await logPaymentEvent(inquiryId, 'checkout.session.completed', stripeEventId, obj)
        if (!isNew) break
        const amountTotal = Number((obj as { amount_total?: number }).amount_total) ?? 0
        const currency = String((obj as { currency?: string }).currency ?? 'usd')
        const paymentMethod = String((obj as { payment_method_types?: string[] }).payment_method_types?.[0] ?? 'card')
        await updateInquiryStatus(inquiryId, 'deposit_paid', 'paid')
        await markPaymentPaid(inquiryId, sessionId, amountTotal, currency)
        await supabase
          .from('inquiries')
          .update({
            payment_link: (obj as { url?: string })?.url ?? null,
            stripe_checkout_session_id: sessionId,
            payment_timestamp: new Date().toISOString(),
            payment_method: paymentMethod,
            updated_at: new Date().toISOString(),
          })
          .eq('id', inquiryId)
        break
      }
      case 'payment_intent.succeeded': {
        const meta = obj?.metadata as Record<string, string> | undefined
        const inquiryId = meta?.inquiry_id ?? getInquiryId()
        if (!inquiryId) break
        const isNew = await logPaymentEvent(inquiryId, 'payment_intent.succeeded', stripeEventId, obj)
        if (!isNew) break
        const amount = Number((obj as { amount?: number }).amount) ?? 0
        const currency = String((obj as { currency?: string }).currency ?? 'usd')
        await updateInquiryStatus(inquiryId, 'deposit_paid', 'paid')
        await markPaymentPaid(inquiryId, getSessionId(), amount, currency)
        break
      }
      case 'payment_intent.payment_failed':
      case 'checkout.session.async_payment_failed': {
        const inquiryId = getInquiryId()
        if (!inquiryId) break
        const isNew = await logPaymentEvent(inquiryId, eventType, stripeEventId, obj)
        if (!isNew) break
        await updateInquiryStatus(inquiryId, 'contacted', 'pending')
        break
      }
      default:
        break
    }
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Webhook processing failed'
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
