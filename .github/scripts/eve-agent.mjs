/**
 * Eve agentic loop. Runs inside the eve-build GitHub Action.
 * Reads the structured spec from SPEC_JSON env var, calls Claude Sonnet
 * with file tools in a loop until the feature is built or the loop stops.
 */

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const specRaw = JSON.parse(process.env.SPEC_JSON ?? '[]')
const spec = Array.isArray(specRaw) ? specRaw[0] : specRaw

if (!spec) {
  console.error('No spec found in SPEC_JSON')
  process.exit(1)
}

const SYSTEM = `You are Claude Code running inside a GitHub Actions workflow on a checked-out Next.js repo.
Your job is to implement this feature step by step, then stop.

Feature: ${spec.title}
Summary: ${spec.summary}

Steps:
${spec.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Acceptance criteria:
${spec.acceptance.map(a => `- ${a}`).join('\n')}

Rules:
- Use the read_file, write_file, list_files, and run_bash tools only.
- run_bash is for running npm commands to check your work (e.g. npx tsc --noEmit). Do not run git.
- Write TypeScript, no any, no hardcoded hex colors — use CSS variables.
- Follow the patterns in the files you read. Match the existing code style exactly.
- When you are done and the build passes, call the done tool.
- If you hit a problem you cannot fix, call the done tool with an error message.`

const tools = [
  {
    name: 'read_file',
    description: 'Read the contents of a file',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write or overwrite a file with new contents',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_files',
    description: 'List files in a directory',
    input_schema: {
      type: 'object',
      properties: { dir: { type: 'string' } },
      required: ['dir'],
    },
  },
  {
    name: 'run_bash',
    description: 'Run a shell command and return stdout+stderr. Use for build/type checks only.',
    input_schema: {
      type: 'object',
      properties: { command: { type: 'string' } },
      required: ['command'],
    },
  },
  {
    name: 'done',
    description: 'Signal that the feature is complete or that you are stuck',
    input_schema: {
      type: 'object',
      properties: { message: { type: 'string' } },
      required: ['message'],
    },
  },
]

function handleTool(name, input) {
  if (name === 'read_file') {
    try { return fs.readFileSync(input.path, 'utf8') }
    catch { return `File not found: ${input.path}` }
  }
  if (name === 'write_file') {
    fs.mkdirSync(path.dirname(input.path), { recursive: true })
    fs.writeFileSync(input.path, input.content, 'utf8')
    return `Written: ${input.path}`
  }
  if (name === 'list_files') {
    try {
      return fs.readdirSync(input.dir).join('\n')
    } catch { return `Cannot read dir: ${input.dir}` }
  }
  if (name === 'run_bash') {
    // Safety: only allow npm/npx/tsc commands
    const allowed = /^(npm|npx|node)\s/
    if (!allowed.test(input.command.trim())) return 'Command not allowed.'
    try {
      return execSync(input.command, { encoding: 'utf8', stdio: 'pipe' })
    } catch (e) {
      return `Error:\n${e.stdout ?? ''}\n${e.stderr ?? ''}`
    }
  }
  return 'Unknown tool'
}

async function run() {
  const messages = [
    { role: 'user', content: `Implement the feature described in the system prompt. Start now.` },
  ]

  let iterations = 0
  const MAX = 40

  while (iterations < MAX) {
    iterations++
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM,
      tools,
      messages,
    })

    messages.push({ role: 'assistant', content: response.content })

    const toolUses = response.content.filter(b => b.type === 'tool_use')
    if (toolUses.length === 0 || response.stop_reason === 'end_turn') break

    const toolResults = []
    let done = false
    for (const tu of toolUses) {
      if (tu.name === 'done') {
        console.log('Agent done:', tu.input.message)
        done = true
        toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: 'ok' })
      } else {
        const result = handleTool(tu.name, tu.input)
        console.log(`[${tu.name}] ${JSON.stringify(tu.input).slice(0, 80)}`)
        toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: result })
      }
    }

    messages.push({ role: 'user', content: toolResults })
    if (done) break
  }

  if (iterations >= MAX) {
    console.error('Agent hit iteration limit without finishing.')
    process.exit(1)
  }
}

run().catch(e => { console.error(e); process.exit(1) })
