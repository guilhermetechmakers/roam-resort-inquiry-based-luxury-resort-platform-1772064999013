-- Manual Payment Collection: extend inquiry_payments, add reconciliations, inquiry payment fields
-- Run with: supabase migration up

-- Extend inquiry_payments with Stripe Connect fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiry_payments' AND column_name = 'stripe_link_id') THEN
    ALTER TABLE public.inquiry_payments ADD COLUMN stripe_link_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiry_payments' AND column_name = 'stripe_account_id') THEN
    ALTER TABLE public.inquiry_payments ADD COLUMN stripe_account_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiry_payments' AND column_name = 'expires_at') THEN
    ALTER TABLE public.inquiry_payments ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiry_payments' AND column_name = 'metadata') THEN
    ALTER TABLE public.inquiry_payments ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiry_payments' AND column_name = 'payment_type') THEN
    ALTER TABLE public.inquiry_payments ADD COLUMN payment_type TEXT DEFAULT 'payment_link';
  END IF;
END $$;

-- Extend inquiries with payment state fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiries' AND column_name = 'payment_state') THEN
    ALTER TABLE public.inquiries ADD COLUMN payment_state VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiries' AND column_name = 'deposit_amount') THEN
    ALTER TABLE public.inquiries ADD COLUMN deposit_amount NUMERIC(12,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiries' AND column_name = 'payment_currency') THEN
    ALTER TABLE public.inquiries ADD COLUMN payment_currency TEXT DEFAULT 'USD';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiries' AND column_name = 'stripe_link_id') THEN
    ALTER TABLE public.inquiries ADD COLUMN stripe_link_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiries' AND column_name = 'stripe_checkout_session_id') THEN
    ALTER TABLE public.inquiries ADD COLUMN stripe_checkout_session_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiries' AND column_name = 'payment_timestamp') THEN
    ALTER TABLE public.inquiries ADD COLUMN payment_timestamp TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inquiries' AND column_name = 'payment_method') THEN
    ALTER TABLE public.inquiries ADD COLUMN payment_method TEXT;
  END IF;
END $$;

-- Reconciliations table for manual reconciliation
CREATE TABLE IF NOT EXISTS public.inquiry_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  attached_files TEXT[] DEFAULT '{}',
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiry_reconciliations_inquiry ON public.inquiry_reconciliations(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_reconciliations_status ON public.inquiry_reconciliations(status);

-- RLS for inquiry_reconciliations
ALTER TABLE public.inquiry_reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Concierge can manage reconciliations"
  ON public.inquiry_reconciliations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'concierge')
  );

CREATE POLICY "Service role manages reconciliations"
  ON public.inquiry_reconciliations FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Payment event log: add idempotency (processed_event_ids) for replay protection
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payment_event_log' AND column_name = 'processed') THEN
    ALTER TABLE payment_event_log ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT false;
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;
