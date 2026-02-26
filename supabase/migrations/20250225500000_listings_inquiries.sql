-- Listings and Inquiries tables for Roam Resort Host Content Management
-- Must run before checkout migrations that reference inquiries(id)
-- Run with: supabase migration up

-- Listings table
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(10) CHECK (status IN ('draft', 'live')) NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  gallery JSONB DEFAULT '[]',
  subtitle TEXT,
  region TEXT,
  style TEXT,
  editorial_content TEXT,
  experience_details TEXT,
  experience_details_json JSONB DEFAULT '{}',
  gallery_urls TEXT[] DEFAULT '{}',
  hero_image_url TEXT,
  capacity INTEGER,
  amenities TEXT[] DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  canonical_url TEXT,
  robots TEXT DEFAULT 'index, follow',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_listings_slug ON public.listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_host_id ON public.listings(host_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_updated_at ON public.listings(updated_at DESC);

CREATE OR REPLACE FUNCTION public.update_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS listings_updated_at ON public.listings;
CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_listings_updated_at();

-- Inquiries table (referenced by checkout migrations)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'new',
  message TEXT,
  reference TEXT UNIQUE,
  check_in DATE,
  check_out DATE,
  guests_count INTEGER,
  flexible_dates BOOLEAN DEFAULT false,
  room_prefs TEXT[],
  budget_hint TEXT,
  contact_preferences JSONB DEFAULT '{}',
  internal_notes TEXT,
  assigned_concierge_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_link TEXT,
  payment_state TEXT DEFAULT 'pending',
  total_amount DECIMAL(12,2),
  receipt_url TEXT,
  guest_name TEXT,
  guest_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_listing_id ON public.inquiries(listing_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_guest_id ON public.inquiries(guest_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);

-- RLS for listings
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can manage own listings"
  ON public.listings FOR ALL
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Public can read live listings"
  ON public.listings FOR SELECT
  USING (status = 'live');

CREATE POLICY "Service role can manage all listings"
  ON public.listings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS for inquiries
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests can create inquiries"
  ON public.inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Guests can read own inquiries"
  ON public.inquiries FOR SELECT
  USING (auth.uid() = guest_id);

CREATE POLICY "Hosts can read inquiries for their listings"
  ON public.inquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = inquiries.listing_id AND l.host_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all inquiries"
  ON public.inquiries FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
