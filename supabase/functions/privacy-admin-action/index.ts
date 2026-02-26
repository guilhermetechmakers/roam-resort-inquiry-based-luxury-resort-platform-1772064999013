/**
 * Privacy Admin Action - Supabase Edge Function
 * POST /functions/v1/privacy-admin-action
 * Admin actions: approve, reject, confirm-export, schedule-delete
 * Requires: Authorization Bearer token with concierge role.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Action = 'approve' | 'reject' | 'confirm-export' | 'schedule-delete'

interface RequestBody {
  action: Action
  requestId: string
  notes?: string
  retentionWindowDays?: number
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, status)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('Authentication required', 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return errorResponse('Invalid or expired token', 401)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = (profile as { role?: string } | null)?.role ?? ''
    const isConcierge = role === 'concierge'
    if (!isConcierge) {
      return errorResponse('Admin access required', 403)
    }

    const body = (await req.json().catch(() => ({}))) as RequestBody
    const { action, requestId, notes, retentionWindowDays = 30 } = body ?? {}

    if (!action || !requestId) {
      return errorResponse('action and requestId required', 400)
    }

    const validActions: Action[] = ['approve', 'reject', 'confirm-export', 'schedule-delete']
    if (!validActions.includes(action)) {
      return errorResponse('Invalid action', 400)
    }

    const { data: reqRow, error: fetchErr } = await supabase
      .from('privacy_requests')
      .select('id, user_id, type, status')
      .eq('id', requestId)
      .single()

    if (fetchErr || !reqRow) {
      return errorResponse('Request not found', 404)
    }

    const userId = reqRow.user_id as string
    const reqType = reqRow.type as string
    const currentStatus = reqRow.status as string

    const insertAudit = async (actionType: string, desc: string) => {
      await supabase.from('audit_logs').insert({
        actor_user_id: user.id,
        action_type: actionType,
        resource: 'privacy_request',
        resource_id: requestId,
        details: { description: desc, target_user_id: userId, notes: notes ?? null },
      })
    }

    if (action === 'approve') {
      if (reqType === 'export') {
        await supabase
          .from('privacy_requests')
          .update({
            status: 'InProgress',
            admin_id: user.id,
            notes: notes ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', requestId)
        await insertAudit('export_approved', 'Admin approved data export request')
        return jsonResponse({ success: true, status: 'InProgress' })
      }
      if (reqType === 'delete') {
        await supabase
          .from('privacy_requests')
          .update({
            status: 'scheduled',
            admin_id: user.id,
            notes: notes ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', requestId)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + retentionWindowDays)
        const { data: schedule } = await supabase
          .from('deletion_schedules')
          .insert({
            user_id: userId,
            request_id: requestId,
            retention_window_days: retentionWindowDays,
            scheduled_at: new Date().toISOString(),
          })
          .select('id')
          .single()
        await insertAudit('delete_approved', `Admin approved deletion; retention ${retentionWindowDays} days`)
        return jsonResponse({ success: true, status: 'scheduled', scheduleId: schedule?.id })
      }
    }

    if (action === 'reject') {
      await supabase
        .from('privacy_requests')
        .update({
          status: 'Failed',
          admin_id: user.id,
          notes: notes ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
      await insertAudit('request_rejected', notes ?? 'Admin rejected request')
      return jsonResponse({ success: true, status: 'Failed' })
    }

    if (action === 'confirm-export' && reqType === 'export') {
      const bundleToken = `bundle-${crypto.randomUUID()}-${Date.now()}`
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)
      await supabase
        .from('export_bundles')
        .insert({
          request_id: requestId,
          token: bundleToken,
          status: 'ready',
          expires_at: expiresAt.toISOString(),
          path: `exports/${requestId}.zip`,
        })

      const downloadUrl = `/api/export/bundle/${bundleToken}`

      await supabase
        .from('privacy_requests')
        .update({
          status: 'Completed',
          download_url: downloadUrl,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      await insertAudit('export_completed', 'Export bundle ready for download')
      return jsonResponse({
        success: true,
        status: 'Completed',
        downloadUrl,
      })
    }

    if (action === 'schedule-delete' && reqType === 'delete') {
      const { data: existing } = await supabase
        .from('deletion_schedules')
        .select('id')
        .eq('request_id', requestId)
        .maybeSingle()

      if (!existing) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + retentionWindowDays)
        await supabase.from('deletion_schedules').insert({
          user_id: userId,
          request_id: requestId,
          retention_window_days: retentionWindowDays,
          scheduled_at: new Date().toISOString(),
        })
      }

      await supabase
        .from('privacy_requests')
        .update({
          status: 'scheduled',
          admin_id: user.id,
          notes: notes ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      await insertAudit('delete_scheduled', `Deletion scheduled; retention ${retentionWindowDays} days`)
      return jsonResponse({ success: true, status: 'scheduled' })
    }

    return errorResponse('Invalid action for request type', 400)
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Internal server error'
    return errorResponse(msg, 500)
  }
})
