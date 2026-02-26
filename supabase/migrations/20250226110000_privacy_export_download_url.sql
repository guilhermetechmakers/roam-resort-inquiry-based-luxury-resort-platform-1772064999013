-- Add download_url to privacy_requests for export type
ALTER TABLE privacy_requests
ADD COLUMN IF NOT EXISTS download_url TEXT;
