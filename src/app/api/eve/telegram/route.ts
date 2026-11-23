import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sanitize } from '@/eve/sanitize'

// Telegram sends POST requests to this endpoint. Auth is the secret token in the
// X-Telegram-Bot-Api-Secret-Token header — not the site JWT (Telegram calls this
// from outside, so it's listed in PUBLIC_API in src/middleware.ts).

const TABLE = 'vkliu_eve_sessions'

function supabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  )
}

async function sendMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })
}

export async function POST(request: Request) {
  // Verify the secret token Telegram sends with every update.
  const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: TelegramUpdate
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const message = body.message
  if (!message?.text) {
    // Telegram sends other update types (edits, reactions, etc.) — just ack them.
    return NextResponse.json({ ok: true })
  }

  const chatId = message.chat.id
  const rawText = message.text
  const telegramUserId = message.from?.id?.toString() ?? 'unknown'

  // Commands: /start, /help
  if (rawText.startsWith('/start') || rawText.startsWith('/help')) {
    await sendMessage(chatId, `*Eve* is listening.\n\nSend me a message and I'll clean and process it.`)
    return NextResponse.json({ ok: true })
  }

  // Sanitize the raw message.
  let cleaned = rawText
  try {
    cleaned = await sanitize(rawText)
  } catch (err) {
    console.error('sanitize error', err)
  }

  // Store the session row.
  const db = supabase()
  await db.from(TABLE).insert({
    telegram_user_id: telegramUserId,
    chat_id: chatId.toString(),
    raw_text: rawText,
    cleaned_text: cleaned,
    status: 'received',
  })

  // Echo the sanitized version back so the user can see the cleanup.
  const changed = cleaned !== rawText
  const reply = changed
    ? `*Cleaned:*\n${cleaned}`
    : cleaned

  await sendMessage(chatId, reply)

  return NextResponse.json({ ok: true })
}

// ── Telegram update types (minimal) ──────────────────────────────────────────

interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

interface TelegramMessage {
  message_id: number
  from?: { id: number; first_name: string }
  chat: { id: number }
  text?: string
}
