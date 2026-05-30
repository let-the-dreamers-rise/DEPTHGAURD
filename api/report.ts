import '../server/env.ts'
import { runAgentScan } from '../server/scan-agent.ts'
import { getDemoCache } from '../server/demo-cache.ts'
import { generateJudgeReport } from '../server/report.ts'

export const config = {
  maxDuration: 300,
}

function pkgFromQuery(q: Record<string, string | string[] | undefined>): string {
  return String(q.pkg ?? q.package ?? '').trim()
}

export default async function handler(
  req: { method?: string; query?: Record<string, string | string[] | undefined> },
  res: {
    status: (n: number) => { json: (b: unknown) => void; send: (b: string) => void }
    setHeader: (k: string, v: string) => void
  }
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'GET only' })
    return
  }

  const q = req.query ?? {}
  const packageName = pkgFromQuery(q)
  const ecosystem = String(q.ecosystem ?? 'npm').trim()
  if (!packageName) {
    res.status(400).json({ error: 'pkg query param is required' })
    return
  }

  try {
    const cached = getDemoCache()
    const result = cached?.pkg === packageName ? cached : await runAgentScan(packageName, ecosystem)
    const md = generateJudgeReport(result)
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    res.setHeader('Content-Disposition', `inline; filename="depthguard-${packageName}-report.md"`)
    res.status(200).send(md)
  } catch (err) {
    console.error('[report]', err)
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
}
