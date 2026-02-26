-- Privacy & Legal Compliance Toolkit - GDPR/CCPA aligned
-- Extends privacy_requests, adds audit_logs, export_bundles, deletion_schedules, verifications, preferences

-- 1. Extend privacy_requests with admin workflow fields
ALTER TABLE public.privacy_requests
  ADD COLUMN IF NOT EXISTS scope JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Extend status values (drop old constraint if exists, add new)
ALTER TABLE public.privacy_requests DROP CONSTRAINT IF EXISTS privacy_requests_status_check;
ALTER TABLE public.privacy_requests ADD CONSTRAINT privacy_requests_status_check
  CHECK (status IN ('Pending', 'InProgress', 'Completed', 'Failed', 'pending', 'approved', 'rejected', 'completed', 'scheduled'));

-- Rename requested_at to created_at if needed for consistency (keep both for backward compat)
-- Add index for admin queries
CREATE INDEX IF NOT EXISTS idx_privacy_requests_admin ON public.privacy_requests(admin_id);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_type_status ON public.privacy_requests(type, status);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_updated ON public.privacy_requests(updated_at);

-- Policy: Concierge can view all and update (approve/reject)
CREATE POLICY "Concierge can view all privacy requests"
  ON public.privacy_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role::text = 'concierge'
    )
  );

CREATE POLICY "Concierge can update privacy requests"
  ON public.privacy_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role::text = 'concierge'
    )
  )
  WITH CHECK (true);

-- 2. Extend existing audit_logs with description (for privacy events)
-- audit_logs already exists from session_security_audit; use actor_user_id, action_type, resource_id
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Export bundles - secure token-based download
CREATE TABLE IF NOT EXISTS public.export_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.privacy_requests(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  path TEXT,
  size_bytes BIGINT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'ready', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_export_bundles_request ON public.export_bundles(request_id);
CREATE INDEX IF NOT EXISTS idx_export_bundles_token ON public.export_bundles(token);
CREATE INDEX IF NOT EXISTS idx_export_bundles_expires ON public.export_bundles(expires_at);

ALTER TABLE public.export_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages export bundles"
  ON public.export_bundles FOR ALL
  USING (auth.role() = 'service_role');

-- 4. Deletion schedules - soft-delete with retention window
CREATE TABLE IF NOT EXISTS public.deletion_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES public.privacy_requests(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  retention_window_days INT NOT NULL DEFAULT 30,
  soft_deleted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deletion_schedules_user ON public.deletion_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_schedules_request ON public.deletion_schedules(request_id);
CREATE INDEX IF NOT EXISTS idx_deletion_schedules_scheduled ON public.deletion_schedules(scheduled_at);

ALTER TABLE public.deletion_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages deletion schedules"
  ON public.deletion_schedules FOR ALL
  USING (auth.role() = 'service_role');

-- 5. Verifications - email verification tokens
CREATE TABLE IF NOT EXISTS public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL DEFAULT 'email',
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verifications_user ON public.verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_token ON public.verifications(token);
CREATE INDEX IF NOT EXISTS idx_verifications_expires ON public.verifications(expires_at);

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages verifications"
  ON public.verifications FOR ALL
  USING (auth.role() = 'service_role');

-- 6. Preferences - user notification and privacy settings
CREATE TABLE IF NOT EXISTS public.preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_email BOOLEAN NOT NULL DEFAULT TRUE,
  notify_push BOOLEAN NOT NULL DEFAULT FALSE,
  data_sharing_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
  ad_personalization_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_settings JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage preferences"
  ON public.preferences FOR ALL
  USING (auth.role() = 'service_role');
