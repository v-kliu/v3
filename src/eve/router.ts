// Message type enum. Add values here to extend the router.
// The telegram webhook uses the prefix to classify, then routes to the right handler.

export const MessageType = {
  BUILD:   'build',    // /build  — feature request, goes to dev pipeline
  JOURNAL: 'journal',  // /journal — personal note, stored as-is
  ASK:     'ask',      // /ask    — question for Eve to research and answer
  UNKNOWN: 'unknown',  // no recognised prefix — routed to BUILD as default
} as const

export type MessageType = typeof MessageType[keyof typeof MessageType]

const PREFIX_MAP: Record<string, MessageType> = {
  '/build':   MessageType.BUILD,
  '/journal': MessageType.JOURNAL,
  '/ask':     MessageType.ASK,
}

export function classifyMessage(text: string): { type: MessageType; body: string } {
  const lower = text.trimStart().toLowerCase()
  for (const [prefix, type] of Object.entries(PREFIX_MAP)) {
    if (lower.startsWith(prefix)) {
      return { type, body: text.slice(prefix.length).trim() }
    }
  }
  return { type: MessageType.UNKNOWN, body: text.trim() }
}
