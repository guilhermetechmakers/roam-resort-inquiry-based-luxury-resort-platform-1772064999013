-- Email Notifications & Templates
-- Template engine, job queue, suppression, support messages.
-- Run with: supabase migration up

-- Email templates with versioning
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT,
  locale TEXT NOT NULL DEFAULT 'en',
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL DEFAULT '',
  text_body TEXT NOT NULL DEFAULT '',
  substitutions_schema JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(name, locale)
);

CREATE INDEX IF NOT EXISTS idx_email_templates_name ON public.email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_locale ON public.email_templates(locale);
CREATE INDEX IF NOT EXISTS idx_email_templates_status ON public.email_templates(status);

-- Template version history
CREATE TABLE IF NOT EXISTS public.email_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL DEFAULT '',
  text_body TEXT NOT NULL DEFAULT '',
  substitutions_schema JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  author UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_email_template_versions_template ON public.email_template_versions(template_id);

-- Email job queue
CREATE TABLE IF NOT EXISTS public.email_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  template_name TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  "to" TEXT NOT NULL,
  "from" TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'delivered', 'bounced', 'failed', 'suppressed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_jobs_status ON public.email_jobs(status);
CREATE INDEX IF NOT EXISTS idx_email_jobs_next_attempt ON public.email_jobs(next_attempt) WHERE status = 'queued';

-- Delivery events (webhook tracking)
CREATE TABLE IF NOT EXISTS public.email_delivery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.email_jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('delivered', 'bounced', 'dropped', 'complaint', 'deferred')),
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_email_delivery_events_job ON public.email_delivery_events(job_id);

-- Suppression list
CREATE TABLE IF NOT EXISTS public.suppression_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  reason TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('sendgrid', 'manual')),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_suppression_list_email ON public.suppression_list(email);

-- User email preferences (unsubscribe)
CREATE TABLE IF NOT EXISTS public.user_email_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  unsubscribed_at TIMESTAMPTZ,
  global_preferences JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Support inquiry messages (conversation thread)
CREATE TABLE IF NOT EXISTS public.support_inquiry_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.contact_inquiries(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('guest', 'concierge')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attachments JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_support_inquiry_messages_inquiry ON public.support_inquiry_messages(inquiry_id);

-- Payment link records (for receipt tracking)
CREATE TABLE IF NOT EXISTS public.payment_link_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE SET NULL,
  link TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_link_records_inquiry ON public.payment_link_records(inquiry_id);

-- Receipt records (post-payment)
CREATE TABLE IF NOT EXISTS public.receipt_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  data JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_receipt_records_user ON public.receipt_records(user_id);

-- Add category to contact_inquiries (general, concierge, billing, technical)
ALTER TABLE public.contact_inquiries
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

ALTER TABLE public.contact_inquiries
  ADD COLUMN IF NOT EXISTS newsletter_opt_in BOOLEAN DEFAULT false;

ALTER TABLE public.contact_inquiries
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Trigger: update updated_at for email_templates
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_templates_updated_at ON public.email_templates;
CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION update_email_templates_updated_at();

-- Trigger: update updated_at for email_jobs
DROP TRIGGER IF EXISTS email_jobs_updated_at ON public.email_jobs;
CREATE TRIGGER email_jobs_updated_at
  BEFORE UPDATE ON public.email_jobs
  FOR EACH ROW EXECUTE FUNCTION update_email_templates_updated_at();

-- RLS for email_templates (concierge only)
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Concierge can manage email_templates"
  ON public.email_templates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  );

CREATE POLICY "Service role manages email_templates"
  ON public.email_templates FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS for email_jobs (concierge read; service writes)
ALTER TABLE public.email_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Concierge can read email_jobs"
  ON public.email_jobs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  );

CREATE POLICY "Service role manages email_jobs"
  ON public.email_jobs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS for suppression_list
ALTER TABLE public.suppression_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Concierge can manage suppression_list"
  ON public.suppression_list FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  );

CREATE POLICY "Service role manages suppression_list"
  ON public.suppression_list FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS for support_inquiry_messages (concierge + user who owns inquiry)
ALTER TABLE public.support_inquiry_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Concierge can manage support_inquiry_messages"
  ON public.support_inquiry_messages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  );

CREATE POLICY "Users can read own inquiry messages"
  ON public.support_inquiry_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contact_inquiries ci
      WHERE ci.id = inquiry_id AND ci.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert guest messages for own inquiry"
  ON public.support_inquiry_messages FOR INSERT
  WITH CHECK (
    sender = 'guest' AND
    EXISTS (
      SELECT 1 FROM public.contact_inquiries ci
      WHERE ci.id = inquiry_id AND ci.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages support_inquiry_messages"
  ON public.support_inquiry_messages FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Seed default email templates
INSERT INTO public.email_templates (name, locale, subject, html_body, text_body, substitutions_schema, status)
VALUES
  ('signup_verification', 'en', 'Verify your Roam Resort account', 
   '<!DOCTYPE html><html><body><h1>Verify your email</h1><p>Hi {{guestName}},</p><p>Click to verify: <a href="{{verificationLink}}">{{verificationLink}}</a></p><p>Roam Resort</p></body></html>',
   'Hi {{guestName}}, verify at {{verificationLink}}',
   '[{"key":"guestName","required":true},{"key":"verificationLink","required":true}]'::jsonb,
   'published'),
  ('inquiry_confirmation', 'en', 'Inquiry Confirmation - {{reference}}',
   '<!DOCTYPE html><html><body><h1>Inquiry Confirmed</h1><p>Dear {{guestName}},</p><p>Reference: {{reference}}</p><p>Our concierge will respond within 24–48 hours.</p><p>Roam Resort</p></body></html>',
   'Dear {{guestName}}, Reference: {{reference}}. We will respond within 24–48 hours.',
   '[{"key":"guestName","required":true},{"key":"reference","required":true},{"key":"inquiryId","required":false}]'::jsonb,
   'published'),
  ('concierge_message', 'en', 'Message from Roam Resort Concierge',
   '<!DOCTYPE html><html><body><h1>Concierge Message</h1><p>Hi {{guestName}},</p><p>{{agentNotes}}</p><p>Roam Resort</p></body></html>',
   'Hi {{guestName}}, {{agentNotes}}',
   '[{"key":"guestName","required":true},{"key":"agentNotes","required":true}]'::jsonb,
   'published'),
  ('payment_link', 'en', 'Your Roam Resort Payment Link',
   '<!DOCTYPE html><html><body><h1>Payment Link</h1><p>Hi {{guestName}},</p><p><a href="{{paymentLink}}">Complete your payment</a></p><p>Roam Resort</p></body></html>',
   'Hi {{guestName}}, pay at {{paymentLink}}',
   '[{"key":"guestName","required":true},{"key":"paymentLink","required":true}]'::jsonb,
   'published'),
  ('receipt_email', 'en', 'Your Roam Resort Receipt - {{receiptId}}',
   '<!DOCTYPE html><html><body><h1>Receipt</h1><p>Hi {{guestName}},</p><p>Amount: {{amount}} {{currency}}</p><p>Receipt ID: {{receiptId}}</p><p>Roam Resort</p></body></html>',
   'Receipt {{receiptId}}: {{amount}} {{currency}}',
   '[{"key":"guestName","required":true},{"key":"amount","required":true},{"key":"currency","required":true},{"key":"receiptId","required":true}]'::jsonb,
   'published'),
  ('support_acknowledgment', 'en', 'We received your message - {{reference}}',
   '<!DOCTYPE html><html><body><h1>Message Received</h1><p>Dear {{guestName}},</p><p>Thank you for contacting Roam Resort. We have received your message (Reference: {{reference}}) and our team will respond within 24–48 hours.</p><p>Roam Resort Concierge</p></body></html>',
   'Dear {{guestName}}, we received your message (Reference: {{reference}}). We will respond within 24–48 hours.',
   '[{"key":"guestName","required":true},{"key":"reference","required":true},{"key":"category","required":false}]'::jsonb,
   'published')
ON CONFLICT (name, locale) DO NOTHING;
