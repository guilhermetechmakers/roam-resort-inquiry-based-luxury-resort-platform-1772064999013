-- Escapia Integration: credentials storage and listings external tracking
-- Allows PMC hosts to connect their Escapia account and sync listings directly.

-- Add external integration tracking columns to listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS external_source TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS external_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ DEFAULT NULL;

-- Unique index to prevent duplicate imports per host/source/unit
CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_external_source_id
  ON public.listings(host_id, external_source, external_id)
  WHERE external_source IS NOT NULL AND external_id IS NOT NULL;

-- Escapia credentials: one row per host
-- client_secret is stored encrypted at rest by Supabase/Postgres
-- The frontend NEVER selects this column (query only non-secret columns)
-- The escapia-sync Edge Function reads it via service role key
CREATE TABLE IF NOT EXISTS public.escapia_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'error', 'syncing')),
  last_sync_count INTEGER DEFAULT 0,
  last_sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT escapia_credentials_host_id_unique UNIQUE (host_id)
);

CREATE INDEX IF NOT EXISTS idx_escapia_credentials_host_id
  ON public.escapia_credentials(host_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_escapia_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS escapia_credentials_updated_at ON public.escapia_credentials;
CREATE TRIGGER escapia_credentials_updated_at
  BEFORE UPDATE ON public.escapia_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_escapia_credentials_updated_at();

ALTER TABLE public.escapia_credentials ENABLE ROW LEVEL SECURITY;

-- Hosts can fully manage their own credentials row
CREATE POLICY "Hosts can manage own Escapia credentials"
  ON public.escapia_credentials
  FOR ALL
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);
