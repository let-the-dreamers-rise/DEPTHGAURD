import type { AgentScanResult } from './scan-agent.ts'

let cached: AgentScanResult | null = null
let warming = false

export function getDemoCache(): AgentScanResult | null {
  return cached
}

export async function warmDemoCache(runScan: (pkg: string, eco: string) => Promise<AgentScanResult>) {
  if (cached || warming) return
  warming = true
  try {
    console.log('⚡ Pre-warming judge demo cache (event-stream)...')
    cached = await runScan('event-stream', 'npm')
    console.log(`✅ Demo cache ready: ${cached.webSignals.length} SERP signals, Why-Now ${cached.whyNow.score}`)
  } catch (e) {
    console.warn('Demo cache warm failed:', e)
  } finally {
    warming = false
  }
}
