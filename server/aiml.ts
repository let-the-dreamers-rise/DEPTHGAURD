/**
 * AI/ML API — intelligence layer (partner challenge + judging)
 * Used in: executive brief, why-now score, web signal classification, remediation
 */

const AIML_URL = 'https://api.aimlapi.com/v1/chat/completions'

export function aimlConfigured(): boolean {
  return Boolean(process.env.AIML_API_KEY)
}

async function aimlChat(system: string, user: string, maxTokens = 400): Promise<string | null> {
  const key = process.env.AIML_API_KEY
  if (!key) return null

  try {
    const res = await fetch(AIML_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.AIML_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: maxTokens,
        temperature: 0.15,
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}

export interface WhyNowResult {
  score: number
  reason: string
  gap: string
}

export interface ClassifiedSignal {
  title: string
  url: string
  snippet: string
  source: 'serp' | 'unlocker'
  extractedText?: string
  aiRelevance?: number
  aiVerdict?: string
}

export async function generateThreatBrief(input: {
  packageName: string
  ecosystem: string
  cveCount: number
  topCves: string[]
  webEvidence: { title: string; url: string; snippet: string }[]
}): Promise<string> {
  const evidenceBlock = input.webEvidence
    .slice(0, 6)
    .map((e, i) => `[${i + 1}] ${e.title}\nURL: ${e.url}\n${e.snippet}`)
    .join('\n\n')

  const prompt = `Package: ${input.packageName} (${input.ecosystem})
Structured CVEs: ${input.cveCount}
Top CVEs: ${input.topCves.join(', ') || 'none'}

Bright Data live web evidence:
${evidenceBlock || 'None'}

Write executive threat brief (max 180 words):
1. Risk level CRITICAL/HIGH/MEDIUM/LOW + one-line verdict
2. What live web found that OSV/GitHub may miss
3. Top 3 DevSecOps remediation actions
4. Cite [number] sources`

  const result = await aimlChat(
    'You are DepthGuard, an enterprise supply chain security agent. Be factual, cite sources.',
    prompt,
    500
  )
  return result ?? fallbackBrief(input)
}

/** AI/ML API: Why-Now score — gap between structured DBs and live web */
export async function computeWhyNowScore(input: {
  packageName: string
  cveCount: number
  webSignalCount: number
  earlyWarnings: number
  webEvidence: { title: string; snippet: string }[]
}): Promise<WhyNowResult> {
  const prompt = `Package: ${input.packageName}
OSV/GitHub CVE count: ${input.cveCount}
Bright Data web signals: ${input.webSignalCount}
Early warnings (web-only): ${input.earlyWarnings}
Top web titles: ${input.webEvidence.slice(0, 4).map((e) => e.title).join('; ')}

Respond ONLY valid JSON:
{"score":0-100,"reason":"one sentence why act now","gap":"what live web shows vs structured DBs"}`

  const raw = await aimlChat(
    'Return only valid JSON. Score urgency for DevSecOps to act on this package today.',
    prompt,
    200
  )

  if (raw) {
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) as WhyNowResult
      if (typeof parsed.score === 'number') {
        return {
          score: Math.max(0, Math.min(100, Math.round(parsed.score))),
          reason: parsed.reason ?? 'Live web signals warrant review.',
          gap: parsed.gap ?? 'Web intelligence may precede structured advisory sync.',
        }
      }
    } catch { /* fallback */ }
  }

  const base = input.earlyWarnings > 0 ? 78 : input.cveCount > 2 ? 65 : input.webSignalCount > 3 ? 55 : 30
  return {
    score: base,
    reason: input.earlyWarnings > 0
      ? 'Bright Data found web-only threat signals not yet in OSV.'
      : input.cveCount > 0
        ? 'Structured CVEs present — review dependency usage.'
        : 'Low urgency based on available signals.',
    gap: input.webSignalCount > 0
      ? `${input.webSignalCount} live web sources vs ${input.cveCount} structured CVE records.`
      : 'No live web gap detected yet.',
  }
}

/** AI/ML API: classify each Bright Data web signal for relevance */
export async function classifyWebSignals(
  packageName: string,
  signals: { title: string; url: string; snippet: string; source: 'serp' | 'unlocker'; extractedText?: string }[]
): Promise<ClassifiedSignal[]> {
  if (signals.length === 0) return []

  const list = signals.slice(0, 8).map((s, i) => `${i + 1}. ${s.title} | ${s.snippet.slice(0, 120)}`).join('\n')

  const prompt = `Package: ${packageName}
Classify each web signal for SUPPLY CHAIN security relevance (0-100).
Signals:
${list}

Respond ONLY JSON array:
[{"index":1,"relevance":0-100,"verdict":"5-word label"}]`

  const raw = await aimlChat(
    'Return only valid JSON array. Classify supply chain threat relevance.',
    prompt,
    350
  )

  const classified: ClassifiedSignal[] = signals.map((s) => ({
    ...s,
    aiRelevance: s.source === 'unlocker' ? 72 : 58,
    aiVerdict: 'Review signal',
  }))

  if (raw) {
    try {
      const arr = JSON.parse(raw.replace(/```json|```/g, '').trim()) as { index: number; relevance: number; verdict: string }[]
      if (Array.isArray(arr)) {
        for (const item of arr) {
          const idx = item.index - 1
          if (classified[idx]) {
            classified[idx].aiRelevance = Math.max(0, Math.min(100, item.relevance))
            classified[idx].aiVerdict = item.verdict ?? 'Review signal'
          }
        }
      }
    } catch { /* keep defaults */ }
  }

  return classified
}

/** AI/ML API: per-package remediation plan */
export async function generateRemediationPlan(input: {
  packageName: string
  ecosystem: string
  topThreats: { cveId: string | null; severity: string; title: string }[]
}): Promise<string[]> {
  const threatList = input.topThreats.slice(0, 5).map((t) => `- ${t.cveId ?? 'signal'}: ${t.title} (${t.severity})`).join('\n')

  const prompt = `Package: ${input.packageName} (${input.ecosystem})
Top threats:
${threatList || 'None critical'}

Return exactly 4 numbered remediation steps for DevSecOps. One line each. No markdown.`

  const raw = await aimlChat(
    'You are a DevSecOps engineer. Give actionable remediation steps.',
    prompt,
    250
  )

  if (raw) {
    const lines = raw.split('\n').map((l) => l.replace(/^\d+[\).\s]+/, '').trim()).filter(Boolean)
    if (lines.length >= 2) return lines.slice(0, 4)
  }

  return [
    `Audit all usages of ${input.packageName} in production repos.`,
    'Pin to patched version or apply npm overrides.',
    'Enable CI supply chain scanning on every PR.',
    'Monitor Bright Data web signals for early warnings.',
  ]
}

function fallbackBrief(input: {
  packageName: string
  ecosystem: string
  cveCount: number
  topCves: string[]
  webEvidence: { title: string; url: string; snippet: string }[]
}): string {
  const level = input.cveCount >= 3 ? 'HIGH' : input.cveCount > 0 ? 'MEDIUM' : 'LOW'
  const webNote =
    input.webEvidence.length > 0
      ? `Bright Data surfaced ${input.webEvidence.length} live web signals including: "${input.webEvidence[0]?.title}".`
      : 'No additional web chatter detected beyond structured databases.'

  return `**Risk: ${level}** — ${input.packageName} (${input.ecosystem})

${input.cveCount} structured vulnerabilities in OSV/GitHub advisories${input.topCves.length ? ` (${input.topCves.slice(0, 3).join(', ')})` : ''}.

${webNote}

**Remediation:** (1) Pin dependencies and run npm audit. (2) Review transitive deps. (3) Enable automated supply chain monitoring in CI.`
}
