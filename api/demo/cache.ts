import '../../server/env.ts'
import { getDemoCache, warmDemoCache } from '../../server/demo-cache.ts'
import { runAgentScan } from '../../server/scan-agent.ts'
import { brightDataConfigured } from '../../server/brightdata.ts'

export const config = {
  maxDuration: 300,
}

export default async function handler(
  _req: unknown,
  res: { status: (n: number) => { json: (b: unknown) => void } }
) {
  try {
    const cached = getDemoCache()
    if (!cached) {
      if (brightDataConfigured()) {
        warmDemoCache((pkg, eco) => runAgentScan(pkg, eco)).catch(() => {})
      }
      res.status(404).json({ ready: false, message: 'Demo cache warming — retry in ~90s' })
      return
    }
    res.status(200).json(cached)
  } catch (err) {
    console.error('[demo/cache]', err)
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
}
