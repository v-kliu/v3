-- Baseline schema for Eve tables as of 2026-11-23.
-- Run this in a fresh Supabase project to recreate the Eve tables.
-- For the live project (chyueowpeovvlwmkfawp) this schema is already applied.
--
-- RULE: every INSERT in src/app/api/eve/ must have a column defined here.
-- If you add a field to an insert, add a migration file AND update the shape
-- constant in src/__tests__/schema-sync.test.ts or the test suite will fail.

CREATE TABLE IF NOT EXISTS vkliu_eve_sessions (
  id                   uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  telegram_chat_id     bigint      NOT NULL DEFAULT 0,
  telegram_user_id     text        NOT NULL DEFAULT 'unknown',
  chat_id              text        NOT NULL DEFAULT '0',
  state                text        NOT NULL DEFAULT 'idle',
  current_decision_id  uuid,
  raw_text             text        NOT NULL DEFAULT '',
  cleaned_text         text        NOT NULL DEFAULT '',
  message_type         text        NOT NULL DEFAULT 'unknown',
  status               text        NOT NULL DEFAULT 'received'
);

CREATE TABLE IF NOT EXISTS vkliu_eve_dev_sessions (
  id                   uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           timestamptz NOT NULL DEFAULT now(),
  session_id           uuid,
  title                text,
  summary              text,
  steps                jsonb,
  acceptance           jsonb,
  files_likely_touched jsonb,
  status               text,
  pr_url               text,
  pr_number            integer
);
