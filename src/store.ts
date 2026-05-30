import { useState, useCallback, useRef } from 'react'
import type { LiveThreat, PipelineStep, AgentScanResult, WebSignal, WhyNowResult } from './api'

export interface ScanRecord {
  id: string
  pkg: string
  ecosystem: string
  timestamp: number
  threats: LiveThreat[]
  webSignals: WebSignal[]
  agentBrief: string
  whyNow: WhyNowResult
  remediationPlan: string[]
  earlyWarningCount: number
  steps: PipelineStep[]
  durationMs: number
  brightDataProducts: string[]
  agents: AgentScanResult['agents']
  slackAlert: AgentScanResult['slackAlert']
  serpStats?: AgentScanResult['serpStats']
}

export interface ScanState {
  scans: ScanRecord[]
  allThreats: LiveThreat[]
  allWebSignals: WebSignal[]
  latestBrief: string | null
  latestWhyNow: WhyNowResult | null
  latestRemediation: string[]
  activeScanPkgs: string[]
  totalScanned: number
  initializing: boolean
  integrations: { brightData: boolean; aiml: boolean; slack: boolean }
}

const INITIAL_STATE: ScanState = {
  scans: [],
  allThreats: [],
  allWebSignals: [],
  latestBrief: null,
  latestWhyNow: null,
  latestRemediation: [],
  activeScanPkgs: [],
  totalScanned: 0,
  initializing: false,
  integrations: { brightData: false, aiml: false, slack: false },
}

export const AUTO_SCAN_PACKAGES = [
  { name: 'event-stream', ecosystem: 'npm' },
  { name: 'ua-parser-js', ecosystem: 'npm' },
  { name: 'lodash', ecosystem: 'npm' },
  { name: 'jsonwebtoken', ecosystem: 'npm' },
]

function mergeThreats(scans: ScanRecord[]): LiveThreat[] {
  const seen = new Set<string>()
  const all: LiveThreat[] = []
  for (const scan of scans) {
    for (const t of scan.threats) {
      const key = t.cveId ?? t.id
      if (!seen.has(key)) {
        seen.add(key)
        all.push(t)
      }
    }
  }
  return all.sort((a, b) => b.score - a.score)
}

function mergeWebSignals(scans: ScanRecord[]): WebSignal[] {
  const seen = new Set<string>()
  const all: WebSignal[] = []
  for (const scan of scans) {
    for (const s of scan.webSignals) {
      if (!seen.has(s.url)) {
        seen.add(s.url)
        all.push(s)
      }
    }
  }
  return all
}

export function useScanStore() {
  const [state, setState] = useState<ScanState>(INITIAL_STATE)
  const hasInitRef = useRef(false)

  const addScan = useCallback((record: ScanRecord) => {
    setState((prev) => {
      const scans = [record, ...prev.scans]
      return {
        ...prev,
        scans,
        allThreats: mergeThreats(scans),
        allWebSignals: mergeWebSignals(scans),
        latestBrief: record.agentBrief || prev.latestBrief,
        latestWhyNow: record.whyNow ?? prev.latestWhyNow,
        latestRemediation: record.remediationPlan?.length ? record.remediationPlan : prev.latestRemediation,
        totalScanned: prev.totalScanned + 1,
        activeScanPkgs: prev.activeScanPkgs.filter((p) => p !== record.pkg),
        integrations: {
          brightData: record.brightDataProducts.length > 0 || prev.integrations.brightData,
          aiml: Boolean(record.agentBrief) || prev.integrations.aiml,
          slack: record.slackAlert?.sent || prev.integrations.slack,
        },
      }
    })
  }, [])

  const setActiveScan = useCallback((pkg: string, active: boolean) => {
    setState((prev) => ({
      ...prev,
      activeScanPkgs: active ? [...prev.activeScanPkgs, pkg] : prev.activeScanPkgs.filter((p) => p !== pkg),
    }))
  }, [])

  const setInitializing = useCallback((v: boolean) => {
    setState((prev) => ({ ...prev, initializing: v }))
  }, [])

  const setIntegrations = useCallback((integrations: { brightData: boolean; aiml: boolean; slack: boolean }) => {
    setState((prev) => ({ ...prev, integrations }))
  }, [])

  const scanPackage = useCallback(async (
    pkg: string,
    ecosystem: string,
    onProgress?: (steps: PipelineStep[]) => void
  ) => {
    setActiveScan(pkg, true)
    const start = Date.now()
    try {
      const { runAgentScan } = await import('./api')
      const result = await runAgentScan(pkg, ecosystem, onProgress)
      const record: ScanRecord = {
        id: `${pkg}-${Date.now()}`,
        pkg,
        ecosystem,
        timestamp: Date.now(),
        threats: result.threats,
        webSignals: result.webSignals,
        agentBrief: result.agentBrief,
        whyNow: result.whyNow,
        remediationPlan: result.remediationPlan,
        earlyWarningCount: result.earlyWarningCount,
        steps: result.steps,
        durationMs: result.durationMs ?? Date.now() - start,
        brightDataProducts: result.brightDataProducts,
        agents: result.agents,
        slackAlert: result.slackAlert,
        serpStats: result.serpStats,
      }
      addScan(record)
      return record
    } catch (e) {
      setActiveScan(pkg, false)
      throw e
    }
  }, [addScan, setActiveScan])

  const batchScan = useCallback(async (packages: { name: string; ecosystem: string }[]) => {
    setInitializing(true)
    const batchSize = 2
    for (let i = 0; i < packages.length; i += batchSize) {
      const batch = packages.slice(i, i + batchSize)
      await Promise.allSettled(batch.map((p) => scanPackage(p.name, p.ecosystem)))
    }
    setInitializing(false)
  }, [scanPackage, setInitializing])

  const initialize = useCallback(async () => {
    if (hasInitRef.current) return
    hasInitRef.current = true
    const { checkHealth } = await import('./api')
    const health = await checkHealth()
    setIntegrations(health)
    batchScan(AUTO_SCAN_PACKAGES)
  }, [batchScan, setIntegrations])

  const scanPackageJson = useCallback(async (jsonStr: string) => {
    const pkg = JSON.parse(jsonStr)
    const deps = Object.keys(pkg.dependencies ?? {})
    const devDeps = Object.keys(pkg.devDependencies ?? {})
    const all = [...new Set([...deps, ...devDeps])]
      .slice(0, 12)
      .map((name) => ({ name, ecosystem: 'npm' }))
    if (all.length === 0) throw new Error('No dependencies found in package.json')
    await batchScan(all)
    return all.length
  }, [batchScan])

  return { state, scanPackage, batchScan, initialize, scanPackageJson }
}

export type { AgentScanResult }
