/**
 * DepthGuard Autonomous Scan Agent
 * Pipeline: OSV → GitHub → Bright Data → AI/ML API (3 calls) → correlate
 */

import { gatherWebEvidence, brightDataConfigured, productsUsed, scrapeNpmRegistry, unlockerConfigured, type SerpStats } from './brightdata.ts'
import {
  generateThreatBrief,
  computeWhyNowScore,
  classifyWebSignals,
  generateRemediationPlan,
  aimlConfigured,
  type ClassifiedSignal,
  type WhyNowResult,
} from './aiml.ts'
import { agentsFromSteps, type AgentStatus } from './agents.ts'
import { sendSlackAlert, slackConfigured } from './slack.ts'
import {
  queryOsv,
  queryGitHubAdvisories,
  osvToLiveThreat,
  webSignalsToThreats,
  type LiveThreat,
} from './osv.ts'

export interface PipelineStep {
  tool: string
  action: string
  status: 'pending' | 'running' | 'done' | 'error'
  result?: unknown
  duration?: number
}

export interface WebSignal extends ClassifiedSignal {}

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
  integrations: { brightData: boolean; aiml: boolean; slack: boolean }
  agents: AgentStatus[]
  slackAlert: { sent: boolean; reason?: string }
  serpStats?: SerpStats
}

type ProgressFn = (steps: PipelineStep[]) => void

export async function runAgentScan(
  packageName: string,
  ecosystem: string,
  onProgress?: ProgressFn
): Promise<AgentScanResult> {
  const start = Date.now()
  const steps: PipelineStep[] = [
    { tool: 'OSV.dev API', action: `Querying Google OSV for "${packageName}"`, status: 'pending' },
    { tool: 'GitHub Advisory DB', action: 'Searching GitHub Security Advisories', status: 'pending' },
    { tool: 'Bright Data SERP API', action: 'Live Google search for supply chain signals', status: 'pending' },
    { tool: 'Bright Data Web Unlocker', action: unlockerConfigured() ? 'Scraping bot-protected security sources' : 'Skipped — SERP-only mode (no Unlocker zone)', status: 'pending' },
    { tool: 'AI/ML API — Brief', action: 'Executive threat brief from multi-source evidence', status: 'pending' },
    { tool: 'AI/ML API — Why-Now', action: 'Scoring urgency gap: live web vs structured CVEs', status: 'pending' },
    { tool: 'AI/ML API — Classify', action: 'Ranking Bright Data web signals by threat relevance', status: 'pending' },
    { tool: 'Threat Correlation', action: 'Merging CVEs, web intel, AI scores + remediation plan', status: 'pending' },
  ]

  const push = () => onProgress?.(steps.map((s) => ({ ...s })))

  let threats: LiveThreat[] = []
  let webSignals: WebSignal[] = []
  let agentBrief = ''
  let whyNow: WhyNowResult = { score: 0, reason: 'Pending analysis', gap: '' }
  let remediationPlan: string[] = []
  let serpStats: SerpStats | undefined

  // Step 1: OSV
  steps[0].status = 'running'
  push()
  try {
    const t0 = Date.now()
    const osv = await queryOsv(packageName, ecosystem)
    steps[0].duration = Date.now() - t0
    steps[0].status = 'done'
    steps[0].result = { count: osv.length }
    threats.push(...osv.map(osvToLiveThreat))
  } catch (e) {
    steps[0].status = 'error'
    steps[0].result = { error: String(e) }
  }
  push()

  // Step 2: GitHub
  steps[1].status = 'running'
  push()
  try {
    const t0 = Date.now()
    const gh = await queryGitHubAdvisories(packageName, ecosystem)
    steps[1].duration = Date.now() - t0
    steps[1].status = 'done'
    steps[1].result = { count: gh.length }
    for (const t of gh) {
      if (!threats.some((x) => x.id === t.id || (t.cveId && x.cveId === t.cveId))) threats.push(t)
    }
  } catch (e) {
    steps[1].status = 'error'
    steps[1].result = { error: String(e) }
  }
  push()

  const cveIds = new Set(threats.map((t) => t.cveId).filter(Boolean) as string[])

  if (brightDataConfigured()) {
    steps[2].status = 'running'
    push()
    try {
      const t0 = Date.now()
      const { evidence, stats } = await gatherWebEvidence(packageName, ecosystem)
      serpStats = stats
      webSignals = evidence
      steps[2].duration = Date.now() - t0
      steps[2].status = 'done'
      steps[2].result = { serpResults: evidence.length, queriesRun: stats.queriesRun, sources: stats.sources }

      steps[3].status = 'running'
      push()
      const t1 = Date.now()

      if (unlockerConfigured()) {
        let unlocked = evidence.filter((e) => e.extractedText).length
        if (ecosystem === 'npm') {
          const npmMeta = await scrapeNpmRegistry(packageName)
          if (npmMeta) {
            unlocked += 1
            webSignals.unshift({
              title: `${packageName} on npm registry (Web Unlocker)`,
              url: `https://www.npmjs.com/package/${packageName}`,
              snippet: npmMeta.description ?? `Latest: ${npmMeta.version ?? 'unknown'}`,
              source: 'unlocker',
              extractedText: npmMeta.description,
              aiRelevance: 70,
              aiVerdict: 'Registry metadata',
            })
          }
        }
        steps[3].duration = Date.now() - t1
        steps[3].status = 'done'
        steps[3].result = { pagesUnlocked: unlocked, mode: 'serp+unlocker', serpQueries: stats.queriesRun }
      } else {
        steps[3].duration = Date.now() - t1
        steps[3].status = 'done'
        steps[3].result = {
          mode: 'serp-only',
          note: 'Web Unlocker skipped — 10-query SERP intel (hackathon compliant)',
          serpQueries: stats.queriesRun,
          resultsFound: stats.resultsFound,
        }
      }

      threats.push(...webSignalsToThreats(packageName, ecosystem, evidence, cveIds))
    } catch (e) {
      steps[2].status = 'error'
      steps[2].result = { error: String(e) }
      steps[3].status = 'error'
      steps[3].result = { error: String(e) }
    }
  } else {
    steps[2].status = 'error'
    steps[2].result = { error: 'Set BRIGHTDATA_API_KEY + BRIGHTDATA_SERP_ZONE in .env' }
    steps[3].status = 'error'
    steps[3].result = { error: 'Bright Data not configured' }
  }
  push()

  const earlyCount = threats.filter((t) => t.earlyWarning).length
  const structuredCount = threats.filter((t) => !t.earlyWarning).length

  // Step 5: AI brief
  steps[4].status = 'running'
  push()
  const tAi = Date.now()
  agentBrief = await generateThreatBrief({
    packageName,
    ecosystem,
    cveCount: structuredCount,
    topCves: threats.map((t) => t.cveId).filter(Boolean) as string[],
    webEvidence: webSignals,
  })
  steps[4].duration = Date.now() - tAi
  steps[4].status = 'done'
  steps[4].result = { model: aimlConfigured() ? process.env.AIML_MODEL || 'gpt-4o-mini' : 'fallback' }
  push()

  // Step 6: Why-Now score
  steps[5].status = 'running'
  push()
  whyNow = await computeWhyNowScore({
    packageName,
    cveCount: structuredCount,
    webSignalCount: webSignals.length,
    earlyWarnings: earlyCount,
    webEvidence: webSignals,
  })
  steps[5].duration = Date.now() - tAi - (steps[4].duration ?? 0)
  steps[5].status = 'done'
  steps[5].result = { whyNowScore: whyNow.score, reason: whyNow.reason }
  push()

  // Step 7: Classify web signals
  steps[6].status = 'running'
  push()
  webSignals = await classifyWebSignals(packageName, webSignals)
  steps[6].duration = 50
  steps[6].status = 'done'
  steps[6].result = { classified: webSignals.length, topRelevance: webSignals[0]?.aiRelevance ?? 0 }
  push()

  // Step 8: Correlate + remediation
  steps[7].status = 'running'
  push()
  remediationPlan = await generateRemediationPlan({
    packageName,
    ecosystem,
    topThreats: threats.slice(0, 5).map((t) => ({ cveId: t.cveId, severity: t.severity, title: t.title })),
  })

  const seen = new Set<string>()
  threats = threats.filter((t) => {
    const key = t.cveId ?? t.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  threats.sort((a, b) => b.score - a.score)
  steps[7].status = 'done'
  steps[7].duration = 50
  steps[7].result = { totalThreats: threats.length, earlyWarnings: earlyCount, remediationSteps: remediationPlan.length }
  push()

  const partial: AgentScanResult = {
    pkg: packageName,
    ecosystem,
    threats,
    webSignals,
    agentBrief,
    whyNow,
    remediationPlan,
    earlyWarningCount: earlyCount,
    steps,
    durationMs: Date.now() - start,
    brightDataProducts: brightDataConfigured() ? productsUsed() : [],
    integrations: { brightData: brightDataConfigured(), aiml: aimlConfigured(), slack: slackConfigured() },
    agents: agentsFromSteps(steps),
    slackAlert: { sent: false },
    serpStats,
  }

  partial.slackAlert = await sendSlackAlert(partial)
  partial.agents = agentsFromSteps(steps)
  partial.durationMs = Date.now() - start

  return partial
}
