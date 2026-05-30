/* ─────────────────────────────────────────────────
   api.ts — DepthGuard Agent API client (SSE + REST)
   ───────────────────────────────────────────────── */

export interface LiveThreat {
  id: string
  package: string
  ecosystem: string
  title: string
  cveId: string | null
  severity: 'critical' | 'high' | 'medium' | 'low'
  score: number
  description: string
  affectsVersions: string
  fixedIn: string | null
  references: string[]
  publishedDate: string
  source: string
  brightDataSource?: string
  earlyWarning?: boolean
}

export interface WebSignal {
  title: string
  url: string
  snippet: string
  source: 'serp' | 'unlocker'
  extractedText?: string
  aiRelevance?: number
  aiVerdict?: string
}

export interface WhyNowResult {
  score: number
  reason: string
  gap: string
}

export interface PipelineStep {
  tool: string
  action: string
  status: 'pending' | 'running' | 'done' | 'error'
  result?: unknown
  duration?: number
}

export interface AgentScanResult {
  pkg: string
  ecosystem: string
  threats: LiveThreat[]
  webSignals: WebSignal[]
  agentBrief: string
  whyNow: WhyNowResult
  remediationPlan: string[]
  earlyWarningCount: number
  steps: PipelineStep[]
  durationMs: number
  brightDataProducts: string[]
  integrations: { brightData: boolean; aiml: boolean; slack?: boolean }
  agents?: { id: string; name: string; role: string; status: string; output?: string }[]
  slackAlert?: { sent: boolean; reason?: string }
  serpStats?: { queriesRun: number; resultsFound: number; sources: string[] }
}

const API_BASE = import.meta.env.VITE_API_URL ?? ''

const PLACEHOLDER_STEPS: PipelineStep[] = [
  { tool: 'OSV.dev API', action: 'Querying Google OSV', status: 'running' },
  { tool: 'GitHub Advisory DB', action: 'Searching advisories', status: 'pending' },
  { tool: 'Bright Data SERP API', action: 'Live Google search', status: 'pending' },
  { tool: 'Bright Data Web Unlocker', action: 'Scraping protected sources', status: 'pending' },
  { tool: 'AI/ML API — Brief', action: 'Executive threat brief', status: 'pending' },
  { tool: 'AI/ML API — Why-Now', action: 'Urgency scoring', status: 'pending' },
  { tool: 'AI/ML API — Classify', action: 'Web signal classification', status: 'pending' },
  { tool: 'Threat Correlation', action: 'Merge + remediation plan', status: 'pending' },
]

function scanViaPost(
  packageName: string,
  ecosystem: string,
  onProgress?: (steps: PipelineStep[]) => void
): Promise<AgentScanResult> {
  onProgress?.(PLACEHOLDER_STEPS)
  return fetch(`${API_BASE}/api/agent/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ package: packageName, ecosystem }),
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error ?? `Scan failed: ${res.status}`)
    }
    const result = (await res.json()) as AgentScanResult
    onProgress?.(result.steps)
    return result
  })
}

export function runAgentScan(
  packageName: string,
  ecosystem: string = 'npm',
  onProgress?: (steps: PipelineStep[]) => void
): Promise<AgentScanResult> {
  if (typeof EventSource === 'undefined') {
    return scanViaPost(packageName, ecosystem, onProgress)
  }

  return new Promise((resolve, reject) => {
    const url = `${API_BASE}/api/agent/scan/stream?package=${encodeURIComponent(packageName)}&ecosystem=${encodeURIComponent(ecosystem)}`
    const es = new EventSource(url)
    let settled = false

    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      es.close()
      fn()
    }

    es.addEventListener('progress', (ev) => {
      try {
        onProgress?.((JSON.parse((ev as MessageEvent).data) as { steps: PipelineStep[] }).steps)
      } catch { /* ignore */ }
    })

    es.addEventListener('complete', (ev) => {
      try {
        const result = JSON.parse((ev as MessageEvent).data) as AgentScanResult
        onProgress?.(result.steps)
        finish(() => resolve(result))
      } catch (e) {
        finish(() => reject(e))
      }
    })

    es.addEventListener('error', () => {
      if (settled) return
      es.close()
      scanViaPost(packageName, ecosystem, onProgress).then(resolve).catch(reject)
    })

    setTimeout(() => {
      if (!settled) {
        es.close()
        scanViaPost(packageName, ecosystem, onProgress).then(resolve).catch(reject)
      }
    }, 180_000)
  })
}

export async function fetchDemoCache(): Promise<AgentScanResult | null> {
  try {
    const res = await fetch(`${API_BASE}/api/demo/cache`)
    if (!res.ok) return null
    return (await res.json()) as AgentScanResult
  } catch {
    return null
  }
}

export function judgeReportUrl(pkg: string, ecosystem = 'npm'): string {
  return `${API_BASE}/api/report?pkg=${encodeURIComponent(pkg)}&ecosystem=${encodeURIComponent(ecosystem)}`
}

export function siemExportUrl(pkg: string, ecosystem = 'npm'): string {
  return `${API_BASE}/api/siem?pkg=${encodeURIComponent(pkg)}&ecosystem=${encodeURIComponent(ecosystem)}`
}

export async function checkHealth(): Promise<{ brightData: boolean; aiml: boolean; slack: boolean; brightDataMode?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/health`)
    if (!res.ok) return { brightData: false, aiml: false, slack: false }
    const data = await res.json()
    return {
      brightData: Boolean(data.brightData),
      aiml: Boolean(data.aiml),
      slack: Boolean(data.slack),
      brightDataMode: data.brightDataMode,
    }
  } catch {
    return { brightData: false, aiml: false, slack: false }
  }
}

export const DEMO_PACKAGES = [
  { name: 'event-stream', ecosystem: 'npm', label: 'event-stream (supply chain)' },
  { name: 'ua-parser-js', ecosystem: 'npm', label: 'ua-parser-js (hijack)' },
  { name: 'lodash', ecosystem: 'npm', label: 'lodash (npm)' },
  { name: 'jsonwebtoken', ecosystem: 'npm', label: 'jsonwebtoken (npm)' },
]
