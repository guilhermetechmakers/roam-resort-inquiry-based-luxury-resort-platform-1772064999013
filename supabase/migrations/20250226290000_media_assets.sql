-- Media Management: media_assets and media_asset_relations
-- Supports listings, hosts, and editorial content with Cloudinary integration.

CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT NOT NULL,
  secure_url TEXT NOT NULL,
  width INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  format TEXT DEFAULT 'jpg',
  bytes INTEGER DEFAULT 0,
  resource_type TEXT DEFAULT 'image',
  type TEXT NOT NULL CHECK (type IN (
    'listing_hero', 'listing_gallery', 'host_avatar',
    'editorial_hero', 'editorial_gallery'
  )),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('listing', 'host', 'editorial')),
  owner_id UUID NOT NULL,
  caption TEXT,
  alt_text TEXT,
  focal_point_x NUMERIC(5,4),
  focal_point_y NUMERIC(5,4),
  transformations JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_media_assets_owner ON media_assets(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_public_id ON media_assets(public_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(type);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at DESC);

CREATE TABLE IF NOT EXISTS public.media_asset_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('listing', 'host', 'editorial')),
  entity_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(media_asset_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_media_asset_relations_entity ON media_asset_relations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_media_asset_relations_position ON media_asset_relations(entity_type, entity_id, position);

-- RLS for media_assets
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Hosts can manage their own listing/host media
CREATE POLICY "Hosts can manage own listing media"
  ON media_assets FOR ALL
  USING (
    owner_type = 'listing' AND EXISTS (
      SELECT 1 FROM listings l WHERE l.id = media_assets.owner_id AND l.host_id = auth.uid()
    )
  )
  WITH CHECK (
    owner_type = 'listing' AND EXISTS (
      SELECT 1 FROM listings l WHERE l.id = media_assets.owner_id AND l.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can manage own host media"
  ON media_assets FOR ALL
  USING (owner_type = 'host' AND owner_id = auth.uid())
  WITH CHECK (owner_type = 'host' AND owner_id = auth.uid());

-- Concierge/admin can manage editorial media
CREATE POLICY "Concierge can manage editorial media"
  ON media_assets FOR ALL
  USING (
    owner_type = 'editorial' AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('concierge', 'admin')
    )
  )
  WITH CHECK (
    owner_type = 'editorial' AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('concierge', 'admin')
    )
  );

-- Public can read media for live listings
CREATE POLICY "Public can read listing media for live listings"
  ON media_assets FOR SELECT
  USING (
    owner_type = 'listing' AND EXISTS (
      SELECT 1 FROM listings l WHERE l.id = media_assets.owner_id AND l.status = 'live'
    )
  );

-- RLS for media_asset_relations
ALTER TABLE media_asset_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Media relations follow media_assets"
  ON media_asset_relations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM media_assets ma
      WHERE ma.id = media_asset_relations.media_asset_id
      AND (
        (ma.owner_type = 'listing' AND EXISTS (SELECT 1 FROM listings l WHERE l.id = ma.owner_id AND l.host_id = auth.uid()))
        OR (ma.owner_type = 'host' AND ma.owner_id = auth.uid())
        OR (ma.owner_type = 'editorial' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('concierge', 'admin')))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM media_assets ma
      WHERE ma.id = media_asset_relations.media_asset_id
      AND (
        (ma.owner_type = 'listing' AND EXISTS (SELECT 1 FROM listings l WHERE l.id = ma.owner_id AND l.host_id = auth.uid()))
        OR (ma.owner_type = 'host' AND ma.owner_id = auth.uid())
        OR (ma.owner_type = 'editorial' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('concierge', 'admin')))
      )
    )
  );

-- Public can read relations for live listings
CREATE POLICY "Public can read listing relations for live listings"
  ON media_asset_relations FOR SELECT
  USING (
    entity_type = 'listing' AND EXISTS (
      SELECT 1 FROM listings l WHERE l.id = media_asset_relations.entity_id AND l.status = 'live'
    )
  );

-- Trigger: update updated_at
CREATE OR REPLACE FUNCTION update_media_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS media_assets_updated_at ON media_assets;
CREATE TRIGGER media_assets_updated_at
  BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION update_media_assets_updated_at();
