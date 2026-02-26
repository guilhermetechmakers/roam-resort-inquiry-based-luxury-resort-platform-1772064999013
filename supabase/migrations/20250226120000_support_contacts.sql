-- Support contact form submissions for concierge team
CREATE TABLE IF NOT EXISTS support_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id text NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL,
  topic text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS; service role can insert (Edge Function uses service role)
ALTER TABLE support_contacts ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated - only service role inserts from Edge Function
CREATE POLICY "Service role can manage support_contacts"
  ON support_contacts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
