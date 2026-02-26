-- Add tags column for keyword/tacit filtering on listings (destinations)
-- Search uses ILIKE on title, subtitle, region, style; tags enable array overlap filtering

-- Add tags column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Index for tag containment (GIN for array ops)
CREATE INDEX IF NOT EXISTS idx_listings_tags ON public.listings USING GIN (tags);
