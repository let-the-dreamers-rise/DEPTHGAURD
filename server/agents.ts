/** Multi-agent swarm labels (LangGraph-style orchestration) */
export const AGENT_ROSTER = [
  { id: 'osv-scout', name: 'OSV Scout', role: 'Structured CVE baseline via Google OSV.dev' },
  { id: 'github-sentinel', name: 'GitHub Sentinel', role: 'GitHub Security Advisory correlation' },
  { id: 'serp-hunter', name: 'SERP Hunter', role: 'Bright Data SERP — live Google web intelligence' },
  { id: 'intel-analyst', name: 'Intel Analyst', role: 'AI/ML API brief, Why-Now score, signal classification' },
  { id: 'response-commander', name: 'Response Commander', role: 'Remediation plan + Slack + SIEM dispatch' },
] as const

export interface AgentStatus {
  id: string
  name: string
  role: string
  status: 'pending' | 'running' | 'done' | 'error'
  output?: string
}

export function agentsFromSteps(steps: { tool: string; status: string; result?: unknown }[]): AgentStatus[] {
  const map: Record<string, number[]> = {
    'osv-scout': [0],
    'github-sentinel': [1],
    'serp-hunter': [2, 3],
    'intel-analyst': [4, 5, 6],
    'response-commander': [7],
  }

  return AGENT_ROSTER.map((agent) => {
    const idxs = map[agent.id] ?? []
    const related = idxs.map((i) => steps[i]).filter(Boolean)
    let status: AgentStatus['status'] = 'pending'
    if (related.some((s) => s.status === 'error')) status = 'error'
    else if (related.some((s) => s.status === 'running')) status = 'running'
    else if (related.length && related.every((s) => s.status === 'done')) status = 'done'
    else if (related.some((s) => s.status === 'done')) status = 'running'

    const last = related[related.length - 1]
    return {
      ...agent,
      status,
      output: last?.result ? JSON.stringify(last.result).slice(0, 120) : undefined,
    }
  })
}
