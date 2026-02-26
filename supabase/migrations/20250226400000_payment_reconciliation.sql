-- Manual Payment Collection: reconciliations table, inquiry_payments extensions
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
END $$;

-- Reconciliations table for manual reconciliation
CREATE TABLE IF NOT EXISTS public.inquiry_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.inquiry_payments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'confirmed', 'reconciled')),
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

-- Idempotency: index for fast lookup of processed events (application checks before insert)
CREATE INDEX IF NOT EXISTS idx_payment_event_log_stripe_event_lookup
  ON public.payment_event_log(stripe_event_id);
