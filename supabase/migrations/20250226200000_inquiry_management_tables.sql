-- Inquiry Management: attachments, activity_log, drafts, internal_notes, payments
-- Run with: supabase migration up

-- Storage bucket for inquiry attachments (10MB limit, allowed types)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inquiry-attachments',
  'inquiry-attachments',
  true,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- inquiry_attachments: store attachment metadata linked to inquiries
CREATE TABLE IF NOT EXISTS public.inquiry_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size INTEGER,
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiry_attachments' AND column_name = 'uploaded_by') THEN
    ALTER TABLE public.inquiry_attachments ADD COLUMN uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_inquiry_attachments_inquiry ON public.inquiry_attachments(inquiry_id);

-- inquiry_activity_log: timeline of actions on inquiries
CREATE TABLE IF NOT EXISTS public.inquiry_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by_role TEXT,
  performed_by_user_id UUID REFERENCES auth.users(id),
  note TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiry_activity_log_inquiry ON public.inquiry_activity_log(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_activity_log_created ON public.inquiry_activity_log(created_at DESC);

-- inquiry_drafts: per-user draft form data with expiration
CREATE TABLE IF NOT EXISTS public.inquiry_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  form_type TEXT NOT NULL DEFAULT 'inquiry',
  data JSONB NOT NULL DEFAULT '{}',
  last_saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inquiry_drafts_user_listing ON public.inquiry_drafts(user_id, listing_id) WHERE listing_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inquiry_drafts_user ON public.inquiry_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_drafts_expires ON public.inquiry_drafts(expires_at);

-- inquiry_internal_notes: structured internal notes for admin
CREATE TABLE IF NOT EXISTS public.inquiry_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiry_internal_notes_inquiry ON public.inquiry_internal_notes(inquiry_id);

-- inquiry_payments: payment links and status for Stripe Connect
CREATE TABLE IF NOT EXISTS public.inquiry_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  stripe_link_url TEXT,
  stripe_session_id TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiry_payments_inquiry ON public.inquiry_payments(inquiry_id);

-- Add metadata column to inquiries if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiries' AND column_name = 'metadata') THEN
    ALTER TABLE public.inquiries ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiries' AND column_name = 'attachments') THEN
    ALTER TABLE public.inquiries ADD COLUMN attachments JSONB DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiries' AND column_name = 'rooms_count') THEN
    ALTER TABLE public.inquiries ADD COLUMN rooms_count INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiries' AND column_name = 'suite_preferences') THEN
    ALTER TABLE public.inquiries ADD COLUMN suite_preferences TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiries' AND column_name = 'consent_privacy') THEN
    ALTER TABLE public.inquiries ADD COLUMN consent_privacy BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiries' AND column_name = 'consent_terms') THEN
    ALTER TABLE public.inquiries ADD COLUMN consent_terms BOOLEAN DEFAULT false;
  END IF;
END $$;

-- RLS for inquiry_attachments
ALTER TABLE public.inquiry_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests can read own inquiry attachments"
  ON public.inquiry_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i WHERE i.id = inquiry_attachments.inquiry_id AND i.guest_id = auth.uid()
    )
  );

CREATE POLICY "Guests can insert attachments for own inquiries"
  ON public.inquiry_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inquiries i WHERE i.id = inquiry_attachments.inquiry_id AND i.guest_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can read attachments for their listings"
  ON public.inquiry_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      JOIN public.listings l ON l.id = i.listing_id
      WHERE i.id = inquiry_attachments.inquiry_id AND l.host_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages inquiry attachments"
  ON public.inquiry_attachments FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Concierge can manage inquiry attachments"
  ON public.inquiry_attachments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  );

-- RLS for inquiry_activity_log
ALTER TABLE public.inquiry_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests can read own inquiry activity"
  ON public.inquiry_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i WHERE i.id = inquiry_activity_log.inquiry_id AND i.guest_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can read activity for their listings"
  ON public.inquiry_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      JOIN public.listings l ON l.id = i.listing_id
      WHERE i.id = inquiry_activity_log.inquiry_id AND l.host_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages activity log"
  ON public.inquiry_activity_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Concierge can manage activity log"
  ON public.inquiry_activity_log FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  );

-- RLS for inquiry_drafts
ALTER TABLE public.inquiry_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own drafts"
  ON public.inquiry_drafts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS for inquiry_internal_notes
ALTER TABLE public.inquiry_internal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can read notes for their listings"
  ON public.inquiry_internal_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      JOIN public.listings l ON l.id = i.listing_id
      WHERE i.id = inquiry_internal_notes.inquiry_id AND l.host_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages internal notes"
  ON public.inquiry_internal_notes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Concierge can manage internal notes"
  ON public.inquiry_internal_notes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  );

-- RLS for inquiry_payments
ALTER TABLE public.inquiry_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests can read own inquiry payments"
  ON public.inquiry_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i WHERE i.id = inquiry_payments.inquiry_id AND i.guest_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can read payments for their listings"
  ON public.inquiry_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      JOIN public.listings l ON l.id = i.listing_id
      WHERE i.id = inquiry_payments.inquiry_id AND l.host_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages inquiry payments"
  ON public.inquiry_payments FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Concierge can manage inquiry payments"
  ON public.inquiry_payments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  );

-- Guests can update own inquiries (e.g. add attachments after creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inquiries' AND policyname = 'Guests can update own inquiries'
  ) THEN
    CREATE POLICY "Guests can update own inquiries"
      ON public.inquiries FOR UPDATE
      USING (auth.uid() = guest_id)
      WITH CHECK (auth.uid() = guest_id);
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Concierge policy: allow concierge role to read/write all inquiries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inquiries' AND policyname = 'Concierge can manage all inquiries'
  ) THEN
    CREATE POLICY "Concierge can manage all inquiries"
      ON public.inquiries FOR ALL
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
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;
