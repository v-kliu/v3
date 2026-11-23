import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are a prompt cleaner for a personal AI assistant. The user is on mobile and may send garbled, autocorrected, or rushed text.

Your job:
1. Fix typos, autocorrect errors, and broken punctuation.
2. Reorganize fragmented thoughts into one clear, structured request.
3. Preserve every piece of the user's intent — do not add, remove, or reinterpret ideas.
4. Output clean prose or bullet points, whichever fits the complexity.
5. Never add preamble, commentary, or signatures. Return only the cleaned text.`

export async function sanitize(raw: string): Promise<string> {
  if (!raw.trim()) return raw

  const msg = await client.messages.create({
    model: 'claude-haiku-5-5',
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: 'user', content: raw }],
  })

  const block = msg.content[0]
  return block.type === 'text' ? block.text.trim() : raw
}
