/**
 * SendGrid Webhook - Supabase Edge Function
 * Handles bounce, unsubscribe, complaint events from SendGrid.
 * Updates email_jobs status and adds to suppression_list.
 * Configure in SendGrid: Event Webhook -> HTTP Post URL
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const events = (await req.json().catch(() => [])) as Array<{
      event?: string
      email?: string
      sg_message_id?: string
      timestamp?: number
      reason?: string
    }>

    const list = Array.isArray(events) ? events : [events]
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    for (const ev of list) {
      const eventType = ev.event ?? ''
      const email = (ev.email ?? '').toLowerCase().trim()
      if (!email) continue

      if (['bounce', 'dropped', 'spamreport', 'unsubscribe'].includes(eventType)) {
        const { data: existing } = await adminClient
          .from('suppression_list')
          .select('id')
          .eq('email', email)
          .limit(1)
          .single()
        if (!existing) {
          await adminClient.from('suppression_list').insert({
            email,
            reason: ev.reason ?? eventType,
            source: 'sendgrid',
          })
        }

        await adminClient
          .from('email_jobs')
          .update({
            status: eventType === 'unsubscribe' ? 'suppressed' : 'bounced',
            updated_at: new Date().toISOString(),
          })
          .eq('to', email)
          .in('status', ['queued', 'sending'])
      }

      if (eventType === 'delivered') {
        const sgId = ev.sg_message_id
        if (sgId) {
          await adminClient
            .from('email_jobs')
            .update({
              status: 'delivered',
              updated_at: new Date().toISOString(),
            })
            .eq('to', email)
            .in('status', ['sending'])
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('sendgrid-webhook error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
