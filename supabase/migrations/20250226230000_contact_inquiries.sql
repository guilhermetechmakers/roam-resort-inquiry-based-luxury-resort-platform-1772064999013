-- Contact Inquiries: General support + Concierge requests
-- Dual-path contact form: General Question vs Concierge Request
-- Run with: supabase migration up

CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  destination_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  guests INTEGER,
  inquiry_reference TEXT,
  is_concierge BOOLEAN NOT NULL DEFAULT false,
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'deposit_paid', 'confirmed', 'closed')),
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_user ON public.contact_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_destination ON public.contact_inquiries(destination_id);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON public.contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created ON public.contact_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_is_concierge ON public.contact_inquiries(is_concierge);

-- Trigger: update updated_at
CREATE OR REPLACE FUNCTION update_contact_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contact_inquiries_updated_at ON public.contact_inquiries;
CREATE TRIGGER contact_inquiries_updated_at
  BEFORE UPDATE ON public.contact_inquiries
  FOR EACH ROW EXECUTE FUNCTION update_contact_inquiries_updated_at();

-- RLS
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Public can insert (form submission)
CREATE POLICY "Anyone can insert contact_inquiries"
  ON public.contact_inquiries FOR INSERT
  WITH CHECK (true);

-- Users can read own inquiries (anonymous submissions readable only by concierge/service)
CREATE POLICY "Users can read own contact_inquiries"
  ON public.contact_inquiries FOR SELECT
  USING (auth.uid() = user_id);

-- Concierge can manage all
CREATE POLICY "Concierge can manage contact_inquiries"
  ON public.contact_inquiries FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  );

-- Service role for Edge Functions
CREATE POLICY "Service role manages contact_inquiries"
  ON public.contact_inquiries FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
