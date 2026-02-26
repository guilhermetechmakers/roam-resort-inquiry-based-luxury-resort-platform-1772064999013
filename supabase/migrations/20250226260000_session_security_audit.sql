-- Session & Security Management: user_sessions, audit_logs, rate_limit_records
-- Run with: supabase migration up

-- user_sessions: track active sessions per user for list/revoke
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  session_token_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_revoked_at ON public.user_sessions(revoked_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON public.user_sessions(user_id, revoked_at) WHERE revoked_at IS NULL;

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages sessions"
  ON public.user_sessions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Concierge can read all sessions"
  ON public.user_sessions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  );

-- audit_logs: admin-focused events for traceability
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  details JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource, resource_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Concierge can read audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  );

CREATE POLICY "Service role manages audit logs"
  ON public.audit_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- rate_limit_records: per-endpoint rate limiting (sliding window)
CREATE TABLE IF NOT EXISTS public.rate_limit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  limit_count INTEGER NOT NULL DEFAULT 20,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  count INTEGER NOT NULL DEFAULT 0,
  breached BOOLEAN NOT NULL DEFAULT false,
  grace_period_until TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limit_records_key ON public.rate_limit_records(key);
CREATE INDEX IF NOT EXISTS idx_rate_limit_records_window ON public.rate_limit_records(window_start);

ALTER TABLE public.rate_limit_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages rate limits"
  ON public.rate_limit_records FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
