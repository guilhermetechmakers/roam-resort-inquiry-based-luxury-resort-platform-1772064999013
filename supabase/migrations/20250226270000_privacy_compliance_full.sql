-- Privacy & Legal Compliance - Full schema for GDPR/CCPA
-- Extends privacy_requests, adds audit_logs, export_bundles, deletion_schedules, verifications, preferences

-- Extend privacy_requests with admin workflow columns
ALTER TABLE privacy_requests
  ADD COLUMN IF NOT EXISTS scope JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update status check to include admin workflow states (keep existing + add new)
DO $$
BEGIN
  ALTER TABLE privacy_requests DROP CONSTRAINT IF EXISTS privacy_requests_status_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
ALTER TABLE privacy_requests ADD CONSTRAINT privacy_requests_status_check
  CHECK (status IN ('Pending', 'InProgress', 'Completed', 'Failed', 'approved', 'rejected', 'scheduled'));

-- Note: audit_logs exists (session_security_audit). Privacy events use actor_user_id, action_type, resource, resource_id, details.

-- Export bundles for secure data package delivery
CREATE TABLE IF NOT EXISTS export_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES privacy_requests(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  path TEXT,
  size_bytes BIGINT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'ready', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_export_bundles_token ON export_bundles(token);
CREATE INDEX IF NOT EXISTS idx_export_bundles_request ON export_bundles(request_id);

-- Deletion schedules with soft-delete and retention window
CREATE TABLE IF NOT EXISTS deletion_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES privacy_requests(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  retention_window_days INT NOT NULL DEFAULT 30,
  soft_deleted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deletion_schedules_user ON deletion_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_schedules_completed ON deletion_schedules(completed_at) WHERE completed_at IS NULL;

-- Verifications for email verification flow
CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL DEFAULT 'email',
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verifications_token ON verifications(token);
CREATE INDEX IF NOT EXISTS idx_verifications_user ON verifications(user_id);

-- User preferences (notification, privacy controls)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_email BOOLEAN NOT NULL DEFAULT true,
  notify_push BOOLEAN NOT NULL DEFAULT false,
  data_sharing_opt_out BOOLEAN NOT NULL DEFAULT false,
  ad_personalization_opt_out BOOLEAN NOT NULL DEFAULT false,
  privacy_settings JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for export_bundles (service role only for creation; user access via token)
ALTER TABLE export_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages export bundles"
  ON export_bundles FOR ALL
  USING (auth.role() = 'service_role');

-- RLS for deletion_schedules (service role only)
ALTER TABLE deletion_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages deletion schedules"
  ON deletion_schedules FOR ALL
  USING (auth.role() = 'service_role');

-- RLS for verifications (user can read own)
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verifications"
  ON verifications FOR SELECT
  USING (auth.uid() = user_id);

-- RLS for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Concierge can read all privacy requests (for admin panel)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'privacy_requests' AND policyname = 'Concierge can read all privacy requests'
  ) THEN
    CREATE POLICY "Concierge can read all privacy requests"
      ON privacy_requests FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'concierge'
        )
      );
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Concierge can update privacy requests (approve/reject)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'privacy_requests' AND policyname = 'Concierge can update privacy requests'
  ) THEN
    CREATE POLICY "Concierge can update privacy requests"
      ON privacy_requests FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'concierge'
        )
      );
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
