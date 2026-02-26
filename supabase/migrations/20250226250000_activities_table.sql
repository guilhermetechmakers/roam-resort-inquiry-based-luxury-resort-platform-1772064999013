-- Activities table: unified timeline for inquiry lifecycle events, emails, admin actions, internal notes
-- Run with: supabase migration up

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_inquiry ON public.activities(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON public.activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activities_event_type ON public.activities(event_type);
CREATE INDEX IF NOT EXISTS idx_activities_is_internal ON public.activities(is_internal);

-- RLS for activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Guests: read own inquiry activities (non-internal only)
CREATE POLICY "Guests can read own inquiry activities (non-internal)"
  ON public.activities FOR SELECT
  USING (
    is_internal = false
    AND EXISTS (
      SELECT 1 FROM public.inquiries i
      WHERE i.id = activities.inquiry_id AND i.guest_id = auth.uid()
    )
  );

-- Hosts: read and insert activities for their listings (internal notes visible)
CREATE POLICY "Hosts can read activities for their listings"
  ON public.activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      JOIN public.listings l ON l.id = i.listing_id
      WHERE i.id = activities.inquiry_id AND l.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can insert activities for their listings"
  ON public.activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      JOIN public.listings l ON l.id = i.listing_id
      WHERE i.id = activities.inquiry_id AND l.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can update own activities"
  ON public.activities FOR UPDATE
  USING (
    actor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.inquiries i
      JOIN public.listings l ON l.id = i.listing_id
      WHERE i.id = activities.inquiry_id AND l.host_id = auth.uid()
    )
  );

-- Concierge: full access
CREATE POLICY "Concierge can manage activities"
  ON public.activities FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  );

-- Service role
CREATE POLICY "Service role manages activities"
  ON public.activities FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
