-- Eve tables. Applied to Supabase via the management API.
-- RLS enabled on all tables, zero policies — service role key bypasses RLS server-side.

CREATE TABLE IF NOT EXISTS vkliu_eve_sessions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz DEFAULT now(),
  telegram_user_id text        NOT NULL,
  chat_id          text        NOT NULL,
  raw_text         text        NOT NULL,
  cleaned_text     text        NOT NULL,
  status           text        NOT NULL DEFAULT 'received'
);
ALTER TABLE vkliu_eve_sessions ENABLE ROW LEVEL SECURITY;

-- vkliu_eve_decisions and vkliu_eve_rules added when the learning loop ships.
