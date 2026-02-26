-- Listings and Inquiries tables for Roam Resort Host Content Management
-- Run with: supabase migration up

-- Listings: editorial destination content with draft/live status
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  body TEXT,
  subtitle TEXT,
  region TEXT,
  style TEXT,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(10) CHECK (status IN ('draft', 'live')) NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  gallery JSONB DEFAULT '[]',
  editorial_content TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  hero_image_url TEXT,
  experience_details TEXT,
  experience_details_json JSONB DEFAULT '{}',
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

CREATE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_host_id ON listings(host_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_updated_at ON listings(updated_at DESC);

-- Trigger: update updated_at on listings
CREATE OR REPLACE FUNCTION update_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status = 'live' AND (OLD.status IS NULL OR OLD.status != 'live') THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS listings_updated_at ON listings;
CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_listings_updated_at();

-- RLS for listings
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Public can read live listings only
CREATE POLICY "Public can read live listings"
  ON listings FOR SELECT
  USING (status = 'live');

-- Hosts can read their own listings (including drafts, for preview/edit)
CREATE POLICY "Hosts can read own listings"
  ON listings FOR SELECT
  USING (auth.uid() = host_id);

-- Hosts can insert their own listings
CREATE POLICY "Hosts can insert own listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Hosts can update/delete own listings
CREATE POLICY "Hosts can update own listings"
  ON listings FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can delete own listings"
  ON listings FOR DELETE
  USING (auth.uid() = host_id);

-- Inquiries: guest inquiries for listings (create if not exists)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference TEXT UNIQUE,
  status VARCHAR(20) DEFAULT 'new',
  message TEXT,
  check_in DATE,
  check_out DATE,
  guests_count INTEGER,
  flexible_dates BOOLEAN DEFAULT FALSE,
  room_prefs TEXT[],
  budget_hint TEXT,
  contact_preferences JSONB DEFAULT '{}',
  internal_notes TEXT,
  assigned_concierge_id UUID REFERENCES auth.users(id),
  payment_link TEXT,
  payment_state VARCHAR(20),
  receipt_url TEXT,
  total_amount NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_listing_id ON inquiries(listing_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_guest_id ON inquiries(guest_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);

-- Add columns to inquiries if they don't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'guest_name') THEN
    ALTER TABLE inquiries ADD COLUMN guest_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'guest_email') THEN
    ALTER TABLE inquiries ADD COLUMN guest_email TEXT;
  END IF;
END $$;

-- RLS for inquiries
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests can manage own inquiries"
  ON inquiries FOR ALL
  USING (auth.uid() = guest_id)
  WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Hosts can read inquiries for own listings"
  ON inquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = inquiries.listing_id AND l.host_id = auth.uid()
    )
  );

-- Note: Create 'listings' storage bucket via Supabase Dashboard if needed.
-- Bucket: listings, public, 5MB limit, image/jpeg, image/png, image/webp
