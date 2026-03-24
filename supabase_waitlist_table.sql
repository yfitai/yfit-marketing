-- ============================================================
-- YFIT Marketing Waitlist Table
-- Run this in your Supabase Dashboard → SQL Editor
-- ============================================================

-- Create the waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id          BIGSERIAL PRIMARY KEY,
  email       VARCHAR(320) NOT NULL UNIQUE,
  first_name  TEXT NOT NULL,
  last_name   TEXT,
  source      VARCHAR(100) DEFAULT 'marketing-website',
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index on email for fast duplicate checks
CREATE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist(email);

-- Enable Row Level Security (RLS)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Allow inserts from the anon key (public signups)
CREATE POLICY "Allow public waitlist signups"
  ON waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Only service role can read all entries
CREATE POLICY "Only service role can read waitlist"
  ON waitlist
  FOR SELECT
  TO service_role
  USING (true);

-- ============================================================
-- After running this, test with:
-- SELECT * FROM waitlist ORDER BY created_at DESC LIMIT 10;
-- ============================================================
