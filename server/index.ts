import './env.ts'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { runAgentScan } from './scan-agent.ts'
import { brightDataConfigured, unlockerConfigured, brightDataMode } from './brightdata.ts'
import { aimlConfigured } from './aiml.ts'
import { slackConfigured } from './slack.ts'
import { toSiemPayload } from './siem.ts'
import { warmDemoCache, getDemoCache } from './demo-cache.ts'
import { generateJudgeReport } from './report.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 8787
const app = express()

app.use(cors())
app.use(express.json({ limit: '2mb' }))

let cacheWarming = false
function ensureDemoCache() {
  if (cacheWarming || getDemoCache() || !brightDataConfigured()) return
  cacheWarming = true
  warmDemoCache((pkg, eco) => runAgentScan(pkg, eco))
    .catch(() => {})
    .finally(() => { cacheWarming = false })
}

app.use((_req, _res, next) => {
  setImmediate(() => ensureDemoCache())
  next()
})

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'DepthGuard Agent API',
    brightData: brightDataConfigured(),
    brightDataMode: brightDataMode(),
    unlocker: unlockerConfigured(),
    aiml: aimlConfigured(),
    slack: slackConfigured(),
    track: 'Security & Compliance — Web Data UNLOCKED',
  })
})

app.get('/api/siem/:pkg', async (req, res) => {
  const packageName = String(req.params.pkg).trim()
  const ecosystem = String(req.query.ecosystem ?? 'npm')
  try {
    const result = await runAgentScan(packageName, ecosystem)
    res.json(toSiemPayload(result))
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/alerts/test-slack', async (_req, res) => {
  if (!slackConfigured()) {
    res.status(400).json({ error: 'Set SLACK_WEBHOOK_URL in .env.secrets' })
    return
  }
  const result = await runAgentScan('event-stream', 'npm')
  res.json({ slack: result.slackAlert, whyNow: result.whyNow.score })
})

app.get('/api/agent/scan/stream', async (req, res) => {
  const packageName = String(req.query.package ?? req.query.pkg ?? '').trim()
  const ecosystem = String(req.query.ecosystem ?? 'npm').trim()
  if (!packageName) {
    res.status(400).json({ error: 'package is required' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  if (typeof res.flushHeaders === 'function') res.flushHeaders()

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  try {
    const result = await runAgentScan(packageName, ecosystem, (steps) => {
      send('progress', { steps })
    })
    send('complete', result)
  } catch (e) {
    send('error', { error: String(e) })
  }
  res.end()
})

app.get('/api/demo/cache', (_req, res) => {
  const cached = getDemoCache()
  if (!cached) {
    res.status(404).json({ ready: false, message: 'Demo cache warming — try again in ~60s' })
    return
  }
  res.json(cached)
})

app.get('/api/report/latest', async (_req, res) => {
  const cached = getDemoCache()
  res.json({
    product: 'DepthGuard',
    track: 'Security & Compliance',
    brightDataProducts: unlockerConfigured() ? ['SERP API', 'Web Unlocker'] : ['SERP API'],
    brightDataMode: brightDataMode(),
    partner: 'AI/ML API',
    demoReady: Boolean(cached),
    demoPackage: cached?.pkg ?? 'event-stream',
    whyNowScore: cached?.whyNow.score ?? null,
    serpSignals: cached?.webSignals.length ?? 0,
    configured: { brightData: brightDataConfigured(), aiml: aimlConfigured() },
  })
})

app.get('/api/report/:pkg', async (req, res) => {
  const packageName = String(req.params.pkg).trim()
  const ecosystem = String(req.query.ecosystem ?? 'npm')
  if (!packageName) {
    res.status(400).json({ error: 'package is required' })
    return
  }
  try {
    const cached = getDemoCache()
    if (cached?.pkg === packageName) {
      res.type('text/markdown').send(generateJudgeReport(cached))
      return
    }
    const result = await runAgentScan(packageName, ecosystem)
    res.type('text/markdown').send(generateJudgeReport(result))
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/agent/scan', async (req, res) => {
  const packageName = String(req.body?.package ?? req.body?.pkg ?? '').trim()
  const ecosystem = String(req.body?.ecosystem ?? 'npm').trim()
  if (!packageName) {
    res.status(400).json({ error: 'package is required' })
    return
  }

  try {
    const result = await runAgentScan(packageName, ecosystem)
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.get('/api/agent/scan/:pkg', async (req, res) => {
  const packageName = String(req.params.pkg).trim()
  const ecosystem = String(req.query.ecosystem ?? 'npm')
  if (!packageName) {
    res.status(400).json({ error: 'package is required' })
    return
  }

  try {
    const result = await runAgentScan(packageName, ecosystem)
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

// Production: serve Vite build
function resolveDistPath(): string {
  const candidates = [
    path.join(process.cwd(), 'dist'),
    path.join(__dirname, '..', 'dist'),
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist'),
  ]
  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'index.html'))) return candidate
  }
  return candidates[0]
}

const distPath = resolveDistPath()
app.use(express.static(distPath))
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) res.status(404).json({ error: 'Build frontend first: npm run build' })
  })
})

export default app

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🛡️  DepthGuard Agent API → http://localhost:${PORT}`)
    console.log(`   Bright Data: ${brightDataConfigured() ? `✅ ${brightDataMode()}` : '❌ missing keys'}`)
    console.log(`   AI/ML API:   ${aimlConfigured() ? '✅ configured' : '⚠️  optional (fallback mode)'}\n`)
    ensureDemoCache()
  })
}
