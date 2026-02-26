-- Export Jobs: CSV export jobs for admin/concierge
-- Run with: supabase migration up

-- Storage bucket for export CSV files (private, signed URLs for download)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'export-csv',
  'export-csv',
  false,
  52428800,
  ARRAY['text/csv', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS for export-csv bucket (service role only for uploads; signed URLs for downloads)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Service role export csv') THEN
    EXECUTE 'CREATE POLICY "Service role export csv" ON storage.objects FOR ALL USING (bucket_id = ''export-csv'' AND auth.role() = ''service_role'') WITH CHECK (bucket_id = ''export-csv'' AND auth.role() = ''service_role'')';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset TEXT NOT NULL CHECK (dataset IN ('inquiries', 'reconciliation')),
  fields TEXT[] NOT NULL DEFAULT '{}',
  date_from TIMESTAMPTZ NOT NULL,
  date_to TIMESTAMPTZ NOT NULL,
  filters JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'complete', 'failed', 'cancelled')),
  rows_exported INTEGER,
  error_message TEXT,
  download_url TEXT,
  storage_path TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_export_jobs_user ON public.export_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON public.export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_export_jobs_created ON public.export_jobs(created_at DESC);

-- RLS
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Concierge can manage export jobs"
  ON public.export_jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role::text = 'concierge'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role::text = 'concierge'
    )
  );

CREATE POLICY "Users can read own export jobs"
  ON public.export_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages export jobs"
  ON public.export_jobs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
