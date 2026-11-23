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

CREATE TABLE IF NOT EXISTS vkliu_eve_dev_sessions (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           timestamptz DEFAULT now(),
  session_id           uuid        NOT NULL REFERENCES vkliu_eve_sessions(id),
  title                text        NOT NULL,
  summary              text        NOT NULL,
  steps                jsonb       NOT NULL DEFAULT '[]',
  acceptance           jsonb       NOT NULL DEFAULT '[]',
  files_likely_touched jsonb       NOT NULL DEFAULT '[]',
  status               text        NOT NULL DEFAULT 'structured',
  pr_url               text,
  pr_number            int
);
ALTER TABLE vkliu_eve_dev_sessions ENABLE ROW LEVEL SECURITY;

-- vkliu_eve_decisions added when the learning loop ships.
