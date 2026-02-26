-- Profiles table for Roam Resort - extends auth.users with app-specific fields
-- Role and is_email_verified support RBAC and email verification flows
-- rate_limit_requests supports resend-verification and password-reset rate limiting
-- Run with: supabase migration up

-- Rate limit table for verification/reset endpoints (used by Edge Functions)
CREATE TABLE IF NOT EXISTS public.rate_limit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_key_endpoint ON public.rate_limit_requests(key, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_requested_at ON public.rate_limit_requests(requested_at);

-- RLS: only service role can access (Edge Functions use service role)
ALTER TABLE public.rate_limit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON public.rate_limit_requests FOR ALL
  USING (auth.role() = 'service_role');

-- Create enum for user roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('guest', 'host', 'concierge');
  END IF;
END $$;

-- Profiles table synced with auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'guest',
  full_name TEXT,
  avatar_url TEXT,
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can manage all (for triggers)
CREATE POLICY "Service role full access"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');

-- Function to sync profile from auth.users on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role_val user_role := 'guest';
  meta JSONB;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  IF meta ? 'role' THEN
    user_role_val := (meta->>'role')::user_role;
  END IF;

  INSERT INTO public.profiles (id, email, role, full_name, avatar_url, is_email_verified, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    user_role_val,
    meta->>'full_name',
    meta->>'avatar_url',
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE),
    COALESCE(NEW.created_at, now()),
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
$$;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update profile when auth.users changes (e.g. email verification)
CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    email = COALESCE(NEW.email, email),
    is_email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, is_email_verified),
    updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email_confirmed_at, email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_updated();

-- Backfill existing auth.users into profiles (idempotent)
INSERT INTO public.profiles (id, email, role, full_name, avatar_url, is_email_verified, created_at, updated_at)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE((u.raw_user_meta_data->>'role')::user_role, 'guest'),
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'avatar_url',
  COALESCE(u.email_confirmed_at IS NOT NULL, FALSE),
  COALESCE(u.created_at, now()),
  now()
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
  is_email_verified = EXCLUDED.is_email_verified,
  updated_at = now();
