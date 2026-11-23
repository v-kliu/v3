import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Uses Sonnet (not Haiku) — this is the critical step that feeds GitHub Actions.
// A bad spec here means bad code. Quality matters more than cost.

const SYSTEM = `You are a senior software engineer turning a feature request into a precise implementation spec.

Output a JSON object with this exact shape:
{
  "title": "short feature name (5 words max)",
  "summary": "one sentence describing what it does and why",
  "steps": [
    "Step 1: ...",
    "Step 2: ...",
    ...
  ],
  "acceptance": [
    "criterion 1",
    "criterion 2",
    ...
  ],
  "files_likely_touched": ["path/to/file.ts", ...]
}

Rules for steps:
- Each step is one atomic action (create file X, add function Y, update route Z).
- Steps must be sequential — each one assumes the previous is done.
- Be specific about file paths, function names, and data shapes.
- No vague steps like "implement the feature" or "update the code".
- 4-10 steps for most features.

Return only the JSON object, no markdown fences, no preamble.`

export interface FeatureSpec {
  title: string
  summary: string
  steps: string[]
  acceptance: string[]
  files_likely_touched: string[]
}

export async function structureFeature(cleanedRequest: string): Promise<FeatureSpec> {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM,
    messages: [{ role: 'user', content: cleanedRequest }],
  })

  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('unexpected response type from structureFeature')

  return JSON.parse(block.text) as FeatureSpec
}
