import type { AgentScanResult } from './scan-agent.ts'

/** SIEM-ready structured alert (Splunk, Datadog, Elastic ingest friendly) */
export function toSiemPayload(result: AgentScanResult) {
  const maxSev = result.threats.some((t) => t.severity === 'critical')
    ? 'critical'
    : result.threats.some((t) => t.severity === 'high')
      ? 'high'
      : result.threats.length > 0
        ? 'medium'
        : 'low'

  return {
    schema: 'depthguard.siem.v1',
    source: 'DepthGuard',
    track: 'Security & Compliance',
    timestamp: new Date().toISOString(),
    event_type: 'supply_chain_scan',
    severity: maxSev,
    why_now_score: result.whyNow.score,
    package: result.pkg,
    ecosystem: result.ecosystem,
    summary: result.whyNow.reason,
    intelligence_gap: result.whyNow.gap,
    bright_data: {
      products: result.brightDataProducts,
      web_signal_count: result.webSignals.length,
      mode: result.brightDataProducts.includes('Web Unlocker') ? 'serp+unlocker' : 'serp-only',
    },
    aiml: { brief: result.agentBrief, remediation: result.remediationPlan },
    threats: result.threats.map((t) => ({
      id: t.id,
      cve: t.cveId,
      severity: t.severity,
      score: t.score,
      title: t.title,
      source: t.source,
      early_warning: Boolean(t.earlyWarning),
      references: t.references,
    })),
    web_signals: result.webSignals.map((s) => ({
      title: s.title,
      url: s.url,
      source: s.source,
      ai_relevance: s.aiRelevance,
      ai_verdict: s.aiVerdict,
    })),
    agents_executed: result.agents?.map((a) => a.name) ?? [],
    duration_ms: result.durationMs,
  }
}
