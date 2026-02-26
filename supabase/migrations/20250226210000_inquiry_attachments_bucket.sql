-- Create storage bucket for inquiry attachments
-- Run with: supabase migration up
-- Note: Create bucket via Supabase Dashboard if this fails (Storage > New bucket: inquiry-attachments, public, 10MB limit)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inquiry-attachments',
  'inquiry-attachments',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS policies for inquiry-attachments bucket
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Service role inquiry attachments') THEN
    EXECUTE 'CREATE POLICY "Service role inquiry attachments" ON storage.objects FOR ALL USING (bucket_id = ''inquiry-attachments'' AND auth.role() = ''service_role'') WITH CHECK (bucket_id = ''inquiry-attachments'' AND auth.role() = ''service_role'')';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
