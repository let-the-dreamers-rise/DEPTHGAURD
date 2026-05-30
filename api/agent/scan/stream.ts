import '../../../server/env.ts'
import { runAgentScan } from '../../../server/scan-agent.ts'

export const config = {
  maxDuration: 300,
}

export default async function handler(
  req: { method?: string; query?: Record<string, string | string[] | undefined> },
  res: {
    status: (n: number) => { json: (b: unknown) => void; end: () => void }
    setHeader: (k: string, v: string) => void
    write: (chunk: string) => void
  }
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'GET only' })
    return
  }

  const q = req.query ?? {}
  const packageName = String(q.package ?? q.pkg ?? '').trim()
  const ecosystem = String(q.ecosystem ?? 'npm').trim()
  if (!packageName) {
    res.status(400).json({ error: 'package is required' })
    return
  }

  try {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    const result = await runAgentScan(packageName, ecosystem, (steps) => {
      send('progress', { steps })
    })
    send('complete', result)
    res.status(200).end()
  } catch (err) {
    console.error('[agent/scan/stream]', err)
    try {
      res.write(`event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`)
    } catch { /* ignore */ }
    res.status(500).end()
  }
}
