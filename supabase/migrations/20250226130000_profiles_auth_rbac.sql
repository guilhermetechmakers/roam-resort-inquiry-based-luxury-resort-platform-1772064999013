-- Profiles table for Roam Resort - syncs with auth.users for role persistence and RLS
-- Supports RBAC: guest, host, concierge
-- Run with: supabase migration up

-- Create enum for user roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('guest', 'host', 'concierge');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Profiles table - extends auth.users with role and profile data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'guest',
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Trigger: auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta JSONB;
  user_role_val user_role;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::JSONB);
  user_role_val := COALESCE(
    (meta->>'role')::user_role,
    'guest'::user_role
  );
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, is_email_verified, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(meta->>'full_name', meta->>'name', ''),
    meta->>'avatar_url',
    user_role_val,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    is_email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, profiles.is_email_verified),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync existing auth.users into profiles (backfill)
INSERT INTO public.profiles (id, email, full_name, avatar_url, role, is_email_verified, created_at, updated_at)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
  u.raw_user_meta_data->>'avatar_url',
  COALESCE((u.raw_user_meta_data->>'role')::user_role, 'guest'::user_role),
  COALESCE(u.email_confirmed_at IS NOT NULL, FALSE),
  COALESCE(u.created_at, now()),
  now()
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
  role = COALESCE(EXCLUDED.role, profiles.role),
  is_email_verified = EXCLUDED.is_email_verified,
  updated_at = now();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can manage all (for Edge Functions, admin)
CREATE POLICY "Service role can manage profiles"
  ON profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Rate limiting for verification and password reset endpoints
CREATE TABLE IF NOT EXISTS rate_limit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_key_endpoint ON rate_limit_requests(key, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_requested_at ON rate_limit_requests(requested_at);

-- RLS: Only service role can access rate_limit_requests (Edge Functions use service role)
ALTER TABLE rate_limit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate_limit_requests"
  ON rate_limit_requests FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Cleanup old rate limit entries (older than 1 hour) - can be run by cron or on each check
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_requests WHERE requested_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql;
