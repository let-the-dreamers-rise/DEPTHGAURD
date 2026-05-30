import type { Decision, MonitorConfig, Severity, Threat } from './data'

/* ───── Severity multipliers ───── */

const severityMultiplier: Record<Severity, number> = {
  critical: 1.0,
  high: 0.75,
  medium: 0.45,
  low: 0.2,
}

/* ───── Score a threat based on config ───── */

export function scoreThreat(threat: Threat, config: MonitorConfig): number {
  const baseScore = threat.score

  // social signal influence
  const hasSocial = threat.sources.includes('social')
  const socialBoost = hasSocial ? (config.socialSignalWeight / 100) * 8 : 0

  // dark web signal influence
  const hasDarkweb = threat.sources.includes('darkweb')
  const darkwebBoost = hasDarkweb ? (config.darkwebWeight / 100) * 10 : 0

  // severity multiplier
  const sevMult = severityMultiplier[threat.severity]

  // source diversity bonus (more sources = more confidence)
  const sourceDiversity = Math.min(12, threat.sources.length * 3)

  const raw = (baseScore * 0.65) + (socialBoost + darkwebBoost) * sevMult + sourceDiversity

  return Math.max(1, Math.min(99, Math.round(raw)))
}

/* ───── Decision based on score + config ───── */

export function decisionFor(score: number, _threat: Threat, config: MonitorConfig): Decision {
  if (score >= config.autoBlockCritical || _threat.severity === 'critical') {
    return 'critical'
  }
  if (score >= config.severityThreshold) {
    return 'warn'
  }
  return 'safe'
}

/* ───── Decision labels ───── */

export function decisionLabel(decision: Decision): string {
  if (decision === 'critical') return 'CRITICAL'
  if (decision === 'warn') return 'WARNING'
  return 'SAFE'
}

/* ───── Format helpers ───── */

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

/* ───── Risk reasons (evidence + config-aware) ───── */

export function riskReasons(threat: Threat, config: MonitorConfig, score: number): string[] {
  const reasons = [...threat.evidence]

  if (score >= config.autoBlockCritical) {
    reasons.unshift(`Threat score ${score} exceeds auto-block threshold (${config.autoBlockCritical})`)
  }

  if (threat.severity === 'critical') {
    reasons.unshift('Severity classified as CRITICAL by AI analysis')
  }

  if (threat.sources.includes('darkweb')) {
    reasons.unshift('Dark web signals detected — elevated risk')
  }

  if (threat.sources.length >= 4) {
    reasons.unshift(`Corroborated across ${threat.sources.length} independent sources`)
  }

  return reasons.slice(0, 6)
}

/* ───── Category labels ───── */

export function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    malware: '🔴 Malware',
    backdoor: '🟠 Backdoor',
    typosquat: '🟡 Typosquat',
    'dependency-confusion': '🟡 Dep Confusion',
    cve: '🔵 CVE',
    'data-leak': '🟣 Data Leak',
  }
  return map[cat] ?? cat
}

/* ───── Source labels ───── */

export function sourceLabel(src: string): string {
  const map: Record<string, string> = {
    'github-advisory': 'GitHub Advisory',
    nvd: 'NVD',
    osv: 'OSV',
    social: 'Social/X',
    darkweb: 'Dark Web',
    registry: 'Pkg Registry',
    blog: 'Security Blog',
  }
  return map[src] ?? src
}
