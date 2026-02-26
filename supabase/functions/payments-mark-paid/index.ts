/**
 * Mark Payment Received - Supabase Edge Function
 * POST /functions/v1/payments-mark-paid
 * Body: { inquiryId, paymentId?, notes?, reconciliation?: { status, notes } }
 * Sets payment state to Paid, creates reconciliation record.
 * Concierge/Admin only.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestPayload {
  inquiryId: string
  paymentId?: string
  notes?: string
  reconciliation?: { status?: string; notes?: string }
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

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload = (await req.json().catch(() => ({}))) as RequestPayload
    const inquiryId = typeof payload?.inquiryId === 'string' ? payload.inquiryId : ''
    const paymentId = typeof payload?.paymentId === 'string' ? payload.paymentId : undefined
    const notes = typeof payload?.notes === 'string' ? payload.notes : ''
    const reconciliation = payload?.reconciliation ?? {}
    const reconStatus = reconciliation?.status ?? 'reconciled'
    const reconNotes = reconciliation?.notes ?? notes

    if (!inquiryId) {
      return new Response(
        JSON.stringify({ error: 'inquiryId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date().toISOString()

    if (paymentId) {
      const { error } = await supabase
        .from('inquiry_payments')
        .update({ status: 'paid', updated_at: now })
        .eq('id', paymentId)
        .eq('inquiry_id', inquiryId)
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
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
      }
    }

    await supabase
      .from('inquiries')
      .update({
        payment_state: 'paid',
        status: 'deposit_paid',
        updated_at: now,
      })
      .eq('id', inquiryId)

    await supabase.from('inquiry_reconciliations').insert({
      inquiry_id: inquiryId,
      status: reconStatus,
      notes: reconNotes,
      reconciled_at: now,
      updated_at: now,
    })

    return new Response(
      JSON.stringify({ success: true }),
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
