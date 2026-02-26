-- Payment event log for Stripe webhook tracking
-- Run with: supabase migration up (or apply manually)

CREATE TABLE IF NOT EXISTS payment_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_event_log_inquiry ON payment_event_log(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_payment_event_log_stripe ON payment_event_log(stripe_event_id);

-- Ensure inquiry_payments has stripe_session_id if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inquiry_payments' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE inquiry_payments ADD COLUMN stripe_session_id TEXT;
  END IF;
END $$;
