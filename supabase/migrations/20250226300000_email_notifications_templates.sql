-- Email Notifications & Templates
-- Tables: email_templates, email_template_versions, email_jobs, email_delivery_events,
--         suppression_list, user_email_preferences, support_inquiry_messages
-- Run with: supabase migration up

-- Email templates (metadata)
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  locale TEXT NOT NULL DEFAULT 'en',
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  subject TEXT NOT NULL DEFAULT '',
  html_body TEXT NOT NULL DEFAULT '',
  text_body TEXT,
  substitutions_schema JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_email_templates_slug ON public.email_templates(slug);
CREATE INDEX IF NOT EXISTS idx_email_templates_locale ON public.email_templates(locale);
CREATE INDEX IF NOT EXISTS idx_email_templates_status ON public.email_templates(status);

-- Template version history
CREATE TABLE IF NOT EXISTS public.email_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  html_body TEXT NOT NULL DEFAULT '',
  text_body TEXT,
  substitutions_schema JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  author UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_email_template_versions_template ON public.email_template_versions(template_id);

-- Email job queue
CREATE TABLE IF NOT EXISTS public.email_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  template_slug TEXT,
  payload JSONB DEFAULT '{}',
  "to" TEXT NOT NULL,
  "from" TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'delivered', 'bounced', 'failed', 'suppressed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_attempt TIMESTAMPTZ,
  last_error TEXT,
  sendgrid_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_jobs_status ON public.email_jobs(status);
CREATE INDEX IF NOT EXISTS idx_email_jobs_next_attempt ON public.email_jobs(next_attempt) WHERE status = 'queued';

-- Delivery events (webhook data)
CREATE TABLE IF NOT EXISTS public.email_delivery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.email_jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_email_delivery_events_job ON public.email_delivery_events(job_id);

-- Suppression list
CREATE TABLE IF NOT EXISTS public.suppression_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT,
  source TEXT CHECK (source IN ('sendgrid', 'manual', 'bounce', 'unsubscribe', 'complaint')),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_suppression_list_email ON public.suppression_list(LOWER(email));

-- User email preferences
CREATE TABLE IF NOT EXISTS public.user_email_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  unsubscribed_at TIMESTAMPTZ,
  global_preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Support inquiry messages (conversation thread)
CREATE TABLE IF NOT EXISTS public.support_inquiry_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.contact_inquiries(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('guest', 'concierge')),
  message TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_support_inquiry_messages_inquiry ON public.support_inquiry_messages(inquiry_id);

-- Add category column to contact_inquiries if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contact_inquiries' AND column_name = 'category'
  ) THEN
    ALTER TABLE public.contact_inquiries ADD COLUMN category TEXT DEFAULT 'general' CHECK (category IN ('general', 'concierge', 'billing', 'technical'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contact_inquiries' AND column_name = 'newsletter_opt_in'
  ) THEN
    ALTER TABLE public.contact_inquiries ADD COLUMN newsletter_opt_in BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contact_inquiries' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.contact_inquiries ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Payment link records (for tracking)
CREATE TABLE IF NOT EXISTS public.payment_link_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE SET NULL,
  link TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_link_records_inquiry ON public.payment_link_records(inquiry_id);

-- Receipt records
CREATE TABLE IF NOT EXISTS public.receipt_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  data JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
);

-- RLS for email_templates
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

-- RLS for email_template_versions
ALTER TABLE public.email_template_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Concierge can manage email_template_versions"
  ON public.email_template_versions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  );
CREATE POLICY "Service role manages email_template_versions"
  ON public.email_template_versions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS for email_jobs
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

-- RLS for email_delivery_events
ALTER TABLE public.email_delivery_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Concierge can read email_delivery_events"
  ON public.email_delivery_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  );
CREATE POLICY "Service role manages email_delivery_events"
  ON public.email_delivery_events FOR ALL
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

-- RLS for user_email_preferences
ALTER TABLE public.user_email_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own email_preferences"
  ON public.user_email_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role manages user_email_preferences"
  ON public.user_email_preferences FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS for support_inquiry_messages
ALTER TABLE public.support_inquiry_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Concierge can manage support_inquiry_messages"
  ON public.support_inquiry_messages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  );
CREATE POLICY "Users can read own support_inquiry_messages"
  ON public.support_inquiry_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contact_inquiries ci
      WHERE ci.id = support_inquiry_messages.inquiry_id AND ci.user_id = auth.uid()
    )
  );
CREATE POLICY "Service role manages support_inquiry_messages"
  ON public.support_inquiry_messages FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS for payment_link_records
ALTER TABLE public.payment_link_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages payment_link_records"
  ON public.payment_link_records FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS for receipt_records
ALTER TABLE public.receipt_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages receipt_records"
  ON public.receipt_records FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger: update updated_at on email_templates
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

-- Insert default transactional templates
INSERT INTO public.email_templates (name, slug, locale, version, status, subject, html_body, text_body, substitutions_schema)
VALUES
  ('Signup Verification', 'signup_verification', 'en', 1, 'published',
   'Verify your Roam Resort account',
   '<!DOCTYPE html><html><body style="font-family: Inter, sans-serif;"><h1>Verify your email</h1><p>Hi {{guestName}},</p><p>Click to verify: <a href="{{verificationLink}}">{{verificationLink}}</a></p><p>Roam Resort</p></body></html>',
   'Hi {{guestName}}, verify at {{verificationLink}}',
   '{"guestName":"string","verificationLink":"string"}'::jsonb),
  ('Inquiry Confirmation', 'inquiry_confirmation', 'en', 1, 'published',
   'Inquiry Confirmed - {{reference}}',
   '<!DOCTYPE html><html><body style="font-family: Inter, sans-serif;"><h1>Inquiry Confirmed</h1><p>Dear {{guestName}},</p><p>Reference: {{reference}}</p><p>Destination: {{listingTitle}}</p><p>Dates: {{checkIn}} – {{checkOut}}</p><p>Roam Resort Concierge</p></body></html>',
   'Inquiry {{reference}} confirmed. Dates: {{checkIn}} – {{checkOut}}',
   '{"guestName":"string","reference":"string","listingTitle":"string","checkIn":"string","checkOut":"string"}'::jsonb),
  ('Concierge Message', 'concierge_message', 'en', 1, 'published',
   'Message from Roam Resort Concierge',
   '<!DOCTYPE html><html><body style="font-family: Inter, sans-serif;"><h1>Concierge Message</h1><p>{{agentNotes}}</p><p>Roam Resort Concierge</p></body></html>',
   '{{agentNotes}}',
   '{"agentNotes":"string"}'::jsonb),
  ('Payment Link', 'payment_link', 'en', 1, 'published',
   'Your payment link - {{reference}}',
   '<!DOCTYPE html><html><body style="font-family: Inter, sans-serif;"><h1>Payment Link</h1><p>Dear {{guestName}},</p><p><a href="{{paymentLink}}">Complete your payment</a></p><p>Roam Resort Concierge</p></body></html>',
   'Payment link: {{paymentLink}}',
   '{"guestName":"string","paymentLink":"string","reference":"string"}'::jsonb),
  ('Receipt', 'receipt_email', 'en', 1, 'published',
   'Receipt - {{receiptId}}',
   '<!DOCTYPE html><html><body style="font-family: Inter, sans-serif;"><h1>Receipt</h1><p>Thank you for your payment.</p><p>Amount: {{amount}} {{currency}}</p><p>Roam Resort</p></body></html>',
   'Receipt {{receiptId}}: {{amount}} {{currency}}',
   '{"receiptId":"string","amount":"string","currency":"string"}'::jsonb),
  ('Support Acknowledgment', 'support_acknowledgment', 'en', 1, 'published',
   'We received your message - {{reference}}',
   '<!DOCTYPE html><html><body style="font-family: Inter, sans-serif;"><h1>Message Received</h1><p>Dear {{guestName}},</p><p>We received your {{category}} inquiry. Reference: {{reference}}</p><p>Our team will respond within 24–48 hours.</p><p>Roam Resort</p></body></html>',
   'We received your message. Reference: {{reference}}',
   '{"guestName":"string","reference":"string","category":"string"}'::jsonb)
ON CONFLICT (slug) DO NOTHING;
