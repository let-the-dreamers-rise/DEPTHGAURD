import type { AgentScanResult } from './scan-agent.ts'

export function slackConfigured(): boolean {
  return Boolean(process.env.SLACK_WEBHOOK_URL?.trim())
}

export async function sendSlackAlert(result: AgentScanResult): Promise<{ sent: boolean; reason?: string }> {
  const url = process.env.SLACK_WEBHOOK_URL?.trim()
  if (!url) return { sent: false, reason: 'SLACK_WEBHOOK_URL not set' }

  const critical = result.threats.filter((t) => t.severity === 'critical' || t.severity === 'high').length
  const shouldAlert = result.whyNow.score >= 55 || critical > 0 || result.earlyWarningCount > 0
  if (!shouldAlert) return { sent: false, reason: 'Below alert threshold' }

  const topUrls = result.webSignals.slice(0, 3).map((s) => `<${s.url}|${s.title.slice(0, 60)}>`).join('\n')

  const payload = {
    text: `DepthGuard: ${result.pkg} — Why-Now ${result.whyNow.score}/100`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `Supply Chain Alert: ${result.pkg}`, emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Why-Now Score:*\n${result.whyNow.score}/100` },
          { type: 'mrkdwn', text: `*Threats:*\n${result.threats.length} (${critical} high/critical)` },
          { type: 'mrkdwn', text: `*Web Signals:*\n${result.webSignals.length} (Bright Data SERP)` },
          { type: 'mrkdwn', text: `*Early Warnings:*\n${result.earlyWarningCount}` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Verdict:* ${result.whyNow.reason}\n*Gap:* ${result.whyNow.gap}` },
      },
      ...(topUrls
        ? [{ type: 'section', text: { type: 'mrkdwn', text: `*Live evidence:*\n${topUrls}` } }]
        : []),
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Remediation:*\n${result.remediationPlan.slice(0, 3).map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
        },
      },
    ],
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return { sent: false, reason: `Slack ${res.status}` }
    return { sent: true }
  } catch (e) {
    return { sent: false, reason: String(e) }
  }
}
