import '../../server/env.ts'
import { runAgentScan } from '../../server/scan-agent.ts'

export const config = {
  maxDuration: 300,
}

export default async function handler(
  req: { method?: string; body?: unknown },
  res: { status: (n: number) => { json: (b: unknown) => void } }
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {})
    const packageName = String(body.package ?? body.pkg ?? '').trim()
    const ecosystem = String(body.ecosystem ?? 'npm').trim()
    if (!packageName) {
      res.status(400).json({ error: 'package is required' })
      return
    }
    const result = await runAgentScan(packageName, ecosystem)
    res.status(200).json(result)
  } catch (err) {
    console.error('[agent/scan POST]', err)
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
}
