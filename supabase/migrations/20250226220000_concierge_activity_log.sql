-- Concierge access to inquiry_activity_log
-- Run with: supabase migration up

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inquiry_activity_log' AND policyname = 'Concierge can read inquiry activity'
  ) THEN
    CREATE POLICY "Concierge can read inquiry activity"
      ON public.inquiry_activity_log FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role IN ('concierge', 'host')
        )
      );
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
