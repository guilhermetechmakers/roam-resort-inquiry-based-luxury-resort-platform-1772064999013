-- Payment event log for Stripe webhook events
-- Stores event type, stripe event id, and payload for audit/reconciliation

CREATE TABLE IF NOT EXISTS payment_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_event_log_inquiry_id ON payment_event_log(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_payment_event_log_stripe_event_id ON payment_event_log(stripe_event_id);

-- Add payment_state to inquiries if not exists (some setups may already have it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inquiries' AND column_name = 'payment_state'
  ) THEN
    ALTER TABLE inquiries ADD COLUMN payment_state TEXT DEFAULT 'pending';
  END IF;
END $$;
