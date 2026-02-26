/**
 * Admin Export - Supabase Edge Function
 * CSV Export / Reports for concierge: fields, hosts, create job, status, download, retry, cancel.
 * Requires concierge role.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const INQUIRY_FIELDS = [
  { id: 'inquiry_id', label: 'Inquiry ID' },
  { id: 'reference', label: 'Reference' },
  { id: 'guest_name', label: 'Guest Name' },
  { id: 'guest_email', label: 'Guest Email' },
  { id: 'destination', label: 'Destination' },
  { id: 'host', label: 'Host' },
  { id: 'inquiry_date', label: 'Inquiry Date' },
  { id: 'check_in', label: 'Check-in' },
  { id: 'check_out', label: 'Check-out' },
  { id: 'guests_count', label: 'Guests' },
  { id: 'status', label: 'Status' },
  { id: 'notes', label: 'Notes' },
  { id: 'payment_status', label: 'Payment Status' },
  { id: 'amount', label: 'Amount' },
  { id: 'currency', label: 'Currency' },
  { id: 'created_at', label: 'Created' },
]

const RECONCILIATION_FIELDS = [
  { id: 'id', label: 'ID' },
  { id: 'inquiry_id', label: 'Inquiry ID' },
  { id: 'reference', label: 'Reference' },
  { id: 'guest_name', label: 'Guest Name' },
  { id: 'amount', label: 'Amount' },
  { id: 'currency', label: 'Currency' },
  { id: 'payment_status', label: 'Payment Status' },
  { id: 'reconciliation_date', label: 'Reconciliation Date' },
  { id: 'notes', label: 'Notes' },
]

function escapeCsv(val: unknown, delim: string): string {
  if (val == null) return ''
  const s = String(val)
  if (s.includes(delim) || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

async function ensureConcierge(req: Request): Promise<{ userId: string; supabase: ReturnType<typeof createClient> } | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !supabaseKey) return null

  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return null

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = (profile as { role?: string } | null)?.role ?? ''
  if (role !== 'concierge') return null

  return { userId: user.id, supabase }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/functions\/v1\/admin-export\/?/, '') || ''
  const id = path && path !== 'admin-export' ? path.replace(/\/.*$/, '') : null

  try {
    if (req.method === 'GET') {
      const dataset = url.searchParams.get('dataset')
      const list = url.searchParams.get('list')
      const definitions = url.searchParams.get('definitions') === '1'

      if (definitions) {
        const auth = await ensureConcierge(req)
        if (!auth) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const datasets = [
          { id: 'inquiries', label: 'Inquiries' },
          { id: 'reconciliation', label: 'Payment Reconciliation' },
        ]
        const defaultMappings: Record<string, string[]> = {
          inquiries: ['reference', 'guest_name', 'destination', 'inquiry_date', 'status', 'amount'],
          reconciliation: ['id', 'inquiry_id', 'reference', 'amount', 'currency', 'payment_status'],
        }
        const exampleHeaders: Record<string, string[]> = {
          inquiries: ['Reference', 'Guest Name', 'Destination', 'Inquiry Date', 'Status', 'Amount'],
          reconciliation: ['ID', 'Inquiry ID', 'Reference', 'Amount', 'Currency', 'Payment Status'],
        }
        return new Response(
          JSON.stringify({ datasets, defaultMappings, exampleHeaders }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const definitions = url.searchParams.get('definitions') === '1'
      const exportId = url.searchParams.get('id') ?? id
      const download = url.searchParams.get('download') === '1'

      if (definitions) {
        const auth = await ensureConcierge(req)
        if (!auth) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const defs = {
          datasets: [
            { id: 'inquiries', label: 'Inquiries' },
            { id: 'reconciliation', label: 'Payment Reconciliation' },
            { id: 'both', label: 'Both (Inquiries + Reconciliation)' },
          ],
          defaultMappings: {
            inquiries: INQUIRY_FIELDS.slice(0, 8).map((f) => f.id),
            reconciliation: RECONCILIATION_FIELDS.slice(0, 6).map((f) => f.id),
            both: [...INQUIRY_FIELDS.slice(0, 5).map((f) => f.id), ...RECONCILIATION_FIELDS.slice(0, 3).map((f) => f.id)],
          },
          exampleHeaders: {
            inquiries: INQUIRY_FIELDS.map((f) => f.label),
            reconciliation: RECONCILIATION_FIELDS.map((f) => f.label),
            both: [...INQUIRY_FIELDS.map((f) => `[Inquiry] ${f.label}`), ...RECONCILIATION_FIELDS.map((f) => `[Recon] ${f.label}`)],
          },
        }
        return new Response(JSON.stringify(defs), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (dataset) {
        const auth = await ensureConcierge(req)
        if (!auth) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const fields = dataset === 'reconciliation' ? RECONCILIATION_FIELDS : INQUIRY_FIELDS
        return new Response(JSON.stringify({ fields }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (list === 'hosts') {
        const auth = await ensureConcierge(req)
        if (!auth) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
        const adminClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        const { data: listings } = await adminClient
          .from('listings')
          .select('id, title, slug, host_id')
          .eq('status', 'live')
        const list = Array.isArray(listings) ? listings : []
        const hosts = list.map((l: { id: string; title?: string; slug?: string; host_id?: string }) => ({
          id: l.id,
          name: l.title ?? '',
          slug: l.slug ?? '',
        }))
        return new Response(JSON.stringify({ hosts }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (list === 'jobs') {
        const auth = await ensureConcierge(req)
        if (!auth) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
        const adminClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100)
        const { data: jobs, error } = await adminClient
          .from('export_jobs')
          .select('*')
          .eq('user_id', auth.userId)
          .order('created_at', { ascending: false })
          .limit(limit)
        if (error) {
          return new Response(JSON.stringify({ error: 'Failed to fetch exports' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const exports = Array.isArray(jobs) ? jobs : []
        return new Response(JSON.stringify({ exports }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (exportId) {
        const auth = await ensureConcierge(req)
        if (!auth) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
        const adminClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        const { data: job, error } = await adminClient
          .from('export_jobs')
          .select('*')
          .eq('id', exportId)
          .eq('user_id', auth.userId)
          .single()

        if (error || !job) {
          return new Response(JSON.stringify({ error: 'Export not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        if (download && (job as { status?: string }).status === 'complete') {
          const storagePath = (job as { storage_path?: string }).storage_path
          if (storagePath) {
            const { data: signed } = await adminClient.storage
              .from('export-csv')
              .createSignedUrl(storagePath, 3600)
            return new Response(JSON.stringify({ downloadUrl: signed?.signedUrl ?? null }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
        }

        return new Response(JSON.stringify(job), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'POST') {
      const auth = await ensureConcierge(req)
      if (!auth) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
      const action = body?.action as string | undefined
      const exportId = (body?.id ?? body?.exportId) as string | undefined

      if (action === 'retry' && exportId) {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
        const adminClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        const { data: job } = await adminClient
          .from('export_jobs')
          .select('*')
          .eq('id', exportId)
          .eq('user_id', auth.userId)
          .single()
        if (!job || (job as { status?: string }).status !== 'failed') {
          return new Response(JSON.stringify({ error: 'Cannot retry' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        await adminClient.from('export_jobs').update({
          status: 'queued',
          error_message: null,
          updated_at: new Date().toISOString(),
        }).eq('id', exportId)
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (action === 'cancel' && exportId) {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
        const adminClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        const { data: job } = await adminClient
          .from('export_jobs')
          .select('status')
          .eq('id', exportId)
          .eq('user_id', auth.userId)
          .single()
        const status = (job as { status?: string } | null)?.status ?? ''
        if (status !== 'queued' && status !== 'processing') {
          return new Response(JSON.stringify({ error: 'Cannot cancel' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        await adminClient.from('export_jobs').update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        }).eq('id', exportId)
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const dataset = body?.dataset as string
      const fields = Array.isArray(body?.fields) ? (body.fields as string[]) : []
      const dateFrom = body?.dateFrom as string
      const dateTo = body?.dateTo as string
      const filters = (body?.filters as Record<string, unknown>) ?? {}
      const delimiter = (body?.delimiter as string) ?? ','
      const includeHeaders = body?.includeHeaders !== false

      if (!dataset || !['inquiries', 'reconciliation'].includes(dataset)) {
        return new Response(JSON.stringify({ error: 'Invalid dataset' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (fields.length === 0) {
        return new Response(JSON.stringify({ error: 'Select at least one field' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const fromDate = new Date(dateFrom || 0)
      const toDate = new Date(dateTo || 0)
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate > toDate) {
        return new Response(JSON.stringify({ error: 'Invalid date range' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const jobPayload = {
        dataset,
        fields,
        date_from: dateFrom,
        date_to: dateTo,
        filters,
        status: 'processing',
        user_id: auth.userId,
        updated_at: new Date().toISOString(),
      }
      const { data: newJob, error: insertErr } = await adminClient
        .from('export_jobs')
        .insert(jobPayload)
        .select('id')
        .single()

      if (insertErr || !newJob) {
        return new Response(JSON.stringify({ error: 'Failed to create export job' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const jobId = (newJob as { id: string }).id

      try {
        let csv = ''
        let rows = 0

        if (dataset === 'inquiries') {
          let query = adminClient
            .from('inquiries')
            .select('*, listing:listings(id, title, host_id), guest:profiles(full_name, email)')
            .gte('created_at', dateFrom)
            .lte('created_at', dateTo)
            .order('created_at', { ascending: false })

          const statusFilter = filters?.status as string | undefined
          if (statusFilter && statusFilter !== 'all') {
            query = query.eq('status', statusFilter)
          }
          const hostId = filters?.hostId as string | undefined
          if (hostId) {
            query = query.eq('listing_id', hostId)
          }
          const destinationId = filters?.destinationId as string | undefined
          if (destinationId) {
            query = query.eq('listing_id', destinationId)
          }
          const search = (filters?.search as string)?.trim()
          if (search) {
            query = query.ilike('reference', `%${search}%`)
          }

          const { data: rowsData } = await query
          const list = Array.isArray(rowsData) ? rowsData : []
          const fieldLabels = INQUIRY_FIELDS.reduce((acc, f) => { acc[f.id] = f.label; return acc }, {} as Record<string, string>)
          const headers = fields.map((f) => fieldLabels[f] ?? f)
          csv = includeHeaders ? headers.join(delimiter) + '\n' : ''

          for (const row of list) {
            const r = row as Record<string, unknown>
            const listing = (r.listing as Record<string, unknown>) ?? {}
            const guest = (r.guest as Record<string, unknown>) ?? {}
            const hostId = listing.host_id as string | undefined
            let hostName = ''
            if (hostId) {
              const { data: hostProfile } = await adminClient.from('profiles').select('full_name').eq('id', hostId).single()
              hostName = (hostProfile as { full_name?: string } | null)?.full_name ?? ''
            }
            const values: Record<string, string> = {
              inquiry_id: String(r.id ?? ''),
              reference: String(r.reference ?? ''),
              guest_name: String(guest.full_name ?? guest.email ?? ''),
              guest_email: String(guest.email ?? ''),
              destination: String(listing.title ?? ''),
              host: hostName,
              inquiry_date: String(r.created_at ?? ''),
              check_in: String(r.check_in ?? ''),
              check_out: String(r.check_out ?? ''),
              guests_count: String(r.guests_count ?? ''),
              status: String(r.status ?? ''),
              notes: String(r.internal_notes ?? ''),
              payment_status: String(r.payment_state ?? 'pending'),
              amount: String(r.total_amount ?? ''),
              currency: 'USD',
              created_at: String(r.created_at ?? ''),
            }
            const rowCells = fields.map((f) => escapeCsv(values[f] ?? '', delimiter))
            csv += rowCells.join(delimiter) + '\n'
            rows++
          }
        } else {
          const { data: paymentsData } = await adminClient
            .from('inquiry_payments')
            .select('*, inquiry:inquiries(id, reference, guest_id, listing_id, created_at)')
            .gte('created_at', dateFrom)
            .lte('created_at', dateTo)
            .order('created_at', { ascending: false })

          const list = Array.isArray(paymentsData) ? paymentsData : []
          const fieldLabels = RECONCILIATION_FIELDS.reduce((acc, f) => { acc[f.id] = f.label; return acc }, {} as Record<string, string>)
          const headers = fields.map((f) => fieldLabels[f] ?? f)
          csv = includeHeaders ? headers.join(delimiter) + '\n' : ''

          for (const row of list) {
            const r = row as Record<string, unknown>
            const inquiry = (r.inquiry as Record<string, unknown>) ?? {}
            const inquiryId = r.inquiry_id ?? inquiry.id
            let guestName = ''
            if (inquiryId) {
              const { data: inv } = await adminClient.from('inquiries').select('guest_id').eq('id', inquiryId).single()
              const gid = (inv as { guest_id?: string } | null)?.guest_id
              if (gid) {
                const { data: gp } = await adminClient.from('profiles').select('full_name, email').eq('id', gid).single()
                guestName = (gp as { full_name?: string; email?: string } | null)?.full_name ?? (gp as { email?: string } | null)?.email ?? ''
              }
            }
            const values: Record<string, string> = {
              id: String(r.id ?? ''),
              inquiry_id: String(inquiryId ?? ''),
              reference: String(inquiry.reference ?? ''),
              guest_name: guestName,
              amount: String(r.amount ?? ''),
              currency: String(r.currency ?? 'USD'),
              payment_status: String(r.status ?? ''),
              reconciliation_date: String(r.updated_at ?? r.created_at ?? ''),
              notes: '',
            }
            const rowCells = fields.map((f) => escapeCsv(values[f] ?? '', delimiter))
            csv += rowCells.join(delimiter) + '\n'
            rows++
          }
        }

        const storagePath = `exports/${jobId}.csv`
        const { error: uploadErr } = await adminClient.storage
          .from('export-csv')
          .upload(storagePath, new Blob([csv], { type: 'text/csv' }), {
            contentType: 'text/csv',
            upsert: true,
          })

        if (uploadErr) {
          await adminClient.from('export_jobs').update({
            status: 'failed',
            error_message: 'Failed to upload CSV',
            updated_at: new Date().toISOString(),
          }).eq('id', jobId)
          return new Response(JSON.stringify({ error: 'Export failed' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const { data: signed } = await adminClient.storage
          .from('export-csv')
          .createSignedUrl(storagePath, 86400)

        await adminClient.from('export_jobs').update({
          status: 'complete',
          rows_exported: rows,
          download_url: signed?.signedUrl ?? null,
          storage_path: storagePath,
          error_message: null,
          updated_at: new Date().toISOString(),
        }).eq('id', jobId)
      } catch (err) {
        const msg = (err as Error)?.message ?? 'Export failed'
        await adminClient.from('export_jobs').update({
          status: 'failed',
          error_message: msg,
          updated_at: new Date().toISOString(),
        }).eq('id', jobId)
      }

      return new Response(JSON.stringify({ id: jobId }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Internal server error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
