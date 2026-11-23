-- vkliu_eve_sessions.telegram_chat_id had a unique constraint left over from an
-- early design where each row represented one user. The table now stores one row
-- per message, so the constraint is wrong and blocks every insert after the first.
ALTER TABLE vkliu_eve_sessions
  DROP CONSTRAINT IF EXISTS vkliu_eve_sessions_telegram_chat_id_key;
