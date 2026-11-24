import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sanitize } from '@/eve/sanitize'
import { classifyMessage, MessageType } from '@/eve/router'
import { structureFeature } from '@/eve/structure'

// Telegram webhook. NOT behind JWT — Telegram calls from outside.
// Auth is X-Telegram-Bot-Api-Secret-Token. Added to PUBLIC_API in src/middleware.ts.

const SESSIONS_TABLE = 'vkliu_eve_sessions'
const DEV_TABLE      = 'vkliu_eve_dev_sessions'

function supabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!)
}

async function sendMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })
}

async function triggerBuild(devSessionId: string, spec: { title: string; steps: string[] }) {
  const token = process.env.GH_PAT
  if (!token) throw new Error('GH_PAT env var not set')

  const res = await fetch('https://api.github.com/repos/v-kliu/v3/actions/workflows/eve-build.yml/dispatches', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ref: 'main',
      inputs: { dev_session_id: devSessionId, title: spec.title },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`workflow_dispatch failed ${res.status}: ${body}`)
  }
}

export async function POST(request: Request) {
  const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: TelegramUpdate
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const message = body.message
  if (!message?.text) return NextResponse.json({ ok: true })

  const chatId = message.chat.id
  const rawText = message.text
  const telegramUserId = message.from?.id?.toString() ?? 'unknown'

  if (rawText.startsWith('/start') || rawText.startsWith('/help')) {
    await sendMessage(chatId,
      `*Eve* is ready.\n\n` +
      `/build <request> — structure a feature and queue it for Claude Code\n` +
      `/journal <note> — save a note\n` +
      `/ask <question> — research a question\n\n` +
      `No prefix? Treated as /build.`
    )
    return NextResponse.json({ ok: true })
  }

  // 1. Sanitize
  let cleaned = rawText
  try { cleaned = await sanitize(rawText) } catch (e) {
    console.error('sanitize error', e)
  }

  // 2. Classify
  const { type, body: routedBody } = classifyMessage(cleaned)
  const effectiveType = type === MessageType.UNKNOWN ? MessageType.BUILD : type

  // 3. Store base session
  const db = supabase()
  const { data: session, error: sessionErr } = await db
    .from(SESSIONS_TABLE)
    .insert({
      telegram_user_id: telegramUserId,
      chat_id: chatId.toString(),
      raw_text: rawText,
      cleaned_text: cleaned,
      message_type: effectiveType,
      status: 'received',
    })
    .select('id')
    .single()

  if (sessionErr || !session) {
    const errDetail = sessionErr ? `${sessionErr.code}: ${sessionErr.message}` : 'no data returned'
    console.error('session insert error', sessionErr)
    await sendMessage(chatId, `Insert failed: ${errDetail}`)
    return NextResponse.json({ ok: true })
  }

  // 4. Route
  if (effectiveType === MessageType.BUILD) {
    await sendMessage(chatId, `Structuring: _${routedBody.slice(0, 80)}…_`)

    let spec
    try {
      spec = await structureFeature(routedBody)
    } catch (e) {
      console.error('structureFeature error', e)
      await sendMessage(chatId, 'Failed to structure the feature. Try again.')
      return NextResponse.json({ ok: true })
    }

    const { data: dev, error: devErr } = await db
      .from(DEV_TABLE)
      .insert({
        session_id: session.id,
        title: spec.title,
        summary: spec.summary,
        steps: spec.steps,
        acceptance: spec.acceptance,
        files_likely_touched: spec.files_likely_touched,
        status: 'structured',
      })
      .select('id')
      .single()

    if (devErr || !dev) {
      console.error('dev session insert error', devErr)
      await sendMessage(chatId, 'Structured but failed to save. Check Supabase.')
      return NextResponse.json({ ok: true })
    }

    // 5. Trigger GitHub Actions
    try {
      await triggerBuild(dev.id, spec)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('triggerBuild error', msg)
      await sendMessage(chatId, `Spec saved but build trigger failed: ${msg}`)
      return NextResponse.json({ ok: true })
    }

    const stepList = spec.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
    await sendMessage(chatId,
      `*${spec.title}*\n${spec.summary}\n\n*Steps queued:*\n${stepList}\n\n_Building…_`
    )

  } else if (effectiveType === MessageType.JOURNAL) {
    await sendMessage(chatId, `Saved note.`)

  } else if (effectiveType === MessageType.ASK) {
    await sendMessage(chatId, `Got your question. Research coming soon.`)
  }

  return NextResponse.json({ ok: true })
}

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
