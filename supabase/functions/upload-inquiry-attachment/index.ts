/**
 * Upload Inquiry Attachment - Supabase Edge Function
 * POST /functions/v1/upload-inquiry-attachment
 * Accepts file upload, stores in Supabase Storage (inquiry-attachments bucket), creates inquiry_attachments record.
 * Auth required. Validates file type and size (max 10MB).
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BUCKET = 'inquiry-attachments'
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

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

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Authorization required' }),
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
  const supabase = createClient(supabaseUrl, supabaseKey)

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired session' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const inquiryId = String(formData.get('inquiryId') ?? '').trim()

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!inquiryId) {
      return new Response(
        JSON.stringify({ error: 'inquiryId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const hasAllowedType =
      ALLOWED_TYPES.includes(file.type) ||
      /\.(jpe?g|png|webp|gif|pdf|docx?)$/i.test(file.name)
    if (!hasAllowedType) {
      return new Response(
        JSON.stringify({ error: 'File type not allowed. Use: images, PDF, or DOC/DOCX' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (file.size > MAX_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File size must be under 10MB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: inquiry } = await supabase
      .from('inquiries')
      .select('id, guest_id')
      .eq('id', inquiryId)
      .single()

    if (!inquiry) {
      return new Response(
        JSON.stringify({ error: 'Inquiry not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const guestId = (inquiry as { guest_id?: string }).guest_id
    if (guestId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You can only add attachments to your own inquiries' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${inquiryId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: uploadError.message ?? 'Upload failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const storageUrl = urlData?.publicUrl ?? ''

    const { data: attachment, error: insertError } = await supabase
      .from('inquiry_attachments')
      .insert({
        inquiry_id: inquiryId,
        filename: file.name,
        mime_type: file.type,
        size: file.size,
        storage_path: path,
        storage_url: storageUrl,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('inquiry_attachments insert error:', insertError)
      await supabase.storage.from(BUCKET).remove([path])
      return new Response(
        JSON.stringify({ error: 'Failed to save attachment record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        id: (attachment as { id: string }).id,
        filename: file.name,
        mime_type: file.type,
        size: file.size,
        storage_url: storageUrl,
        uploaded_at: (attachment as { uploaded_at?: string }).uploaded_at,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('upload-inquiry-attachment error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? 'Upload failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
