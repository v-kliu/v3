// Parses RULES.md into sections of numbered rules, so the Eve dev page can show the
// real rule text next to each workflow stage. RULES.md stays the single source of truth:
// edit it and the page picks up the new wording on the next build.
//
// Format it expects (see RULES.md):
//   Section title            <- any non-indented line followed by a "1." line
//   1. Rule text
//      continuation lines are indented
//   2. Next rule

export interface Rule {
  n: number
  text: string
}

export interface RuleSection {
  title: string
  rules: Rule[]
}

export interface ParsedRules {
  updated: string | null
  sections: RuleSection[]
}

const NUMBERED = /^(\d+)\.\s+(.*)$/

export function parseRules(md: string): ParsedRules {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const updated = lines[0]?.match(/updated:\s*([^)\s—-]+)/)?.[1] ?? null
  const sections: RuleSection[] = []
  let current: RuleSection | null = null
  let last: Rule | null = null

  const nextNonBlank = (i: number) => {
    for (let j = i + 1; j < lines.length; j++) if (lines[j].trim()) return lines[j]
    return ''
  }

  lines.forEach((line, i) => {
    if (!line.trim()) return
    const m = line.match(NUMBERED)
    if (m && current) {
      last = { n: Number(m[1]), text: m[2].trim() }
      current.rules.push(last)
    } else if (/^\s/.test(line) && last) {
      last.text += ' ' + line.trim()
    } else if (!/^\s/.test(line) && /^1\.\s/.test(nextNonBlank(i))) {
      current = { title: line.trim(), rules: [] }
      sections.push(current)
      last = null
    } else {
      last = null
    }
  })

  return { updated, sections }
}

export function findRule(parsed: ParsedRules, section: string, n: number): Rule | undefined {
  return parsed.sections.find(s => s.title === section)?.rules.find(r => r.n === n)
}
