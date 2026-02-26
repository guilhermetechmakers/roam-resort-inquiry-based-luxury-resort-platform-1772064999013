-- Terms & Privacy - Migration stubs for future integration
-- Run with: supabase migration up (or apply manually)
-- These tables support future CMS-driven Terms content and GDPR/CCPA privacy requests.

-- PrivacyRequest: Future integration for GDPR/CCPA data export and account deletion
CREATE TABLE IF NOT EXISTS privacy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('export', 'delete', 'access')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'InProgress', 'Completed', 'Failed')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_user ON privacy_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON privacy_requests(status);

-- TermsPageContent: Optional CMS hook for dynamic Terms content (locale, lastUpdated, sections)
-- Sections stored as JSONB for flexibility; structure: [{ id, title, body, bullets?, disclaimer?, listType? }]
CREATE TABLE IF NOT EXISTS terms_page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale TEXT NOT NULL DEFAULT 'en',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  sections JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(locale)
);

-- RLS: Privacy requests are user-scoped
ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own privacy requests"
  ON privacy_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy requests"
  ON privacy_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Terms content is public read (no auth required for static content)
ALTER TABLE terms_page_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Terms content is publicly readable"
  ON terms_page_content FOR SELECT
  USING (true);
