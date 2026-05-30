import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  ExternalLink,
  Globe,
  Loader2,
  Package,
  Radio,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
  Zap,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Database,
  Upload,
  Bug,
  XCircle,
  CheckCircle2,
} from 'lucide-react'
import { brightDataProducts, navItems, researchSignals, marketNotes, primitives } from './data'
import { useScanStore } from './store'
import type { LiveThreat, PipelineStep, WebSignal } from './api'

type TabId = 'feed' | 'webintel' | 'stacks' | 'scanning' | 'incidents' | 'audit' | 'brightdata'

/* ─── Shared ─── */

function SevPill({ severity }: { severity: string }) {
  const s = severity === 'critical' ? 'critical' : severity === 'high' ? 'warn' : 'safe'
  const Icon = s === 'critical' ? X : s === 'warn' ? AlertTriangle : Check
  return <span className={`pill ${s}`}><Icon size={13} />{severity.toUpperCase()}</span>
}

function RiskBar({ score }: { score: number }) {
  const tone = score >= 70 ? 'danger' : score >= 40 ? 'warn' : 'safe'
  return (
    <div className="risk-meter">
      <div className="risk-meter__track"><span className={tone} style={{ width: `${score}%` }} /></div>
      <strong>{score}</strong>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════ */

function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [visibleStats, setVisibleStats] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleStats((prev) => { if (prev >= 4) { clearInterval(timer); return 4 } return prev + 1 })
    }, 300)
    return () => clearInterval(timer)
  }, [])

  const stats = [
    { label: 'Autonomous agents', value: '5', sub: 'LangGraph-style swarm' },
    { label: 'Bright Data SERP', value: 'Live', sub: '10-query web intel' },
    { label: 'Slack + SIEM', value: 'On', sub: 'enterprise dispatch' },
    { label: 'Track', value: 'Sec', sub: 'Security & Compliance' },
  ]

  return (
    <div className="landing">
      <div className="landing-bg"><div className="bg-glow bg-glow-1" /><div className="bg-glow bg-glow-2" /><div className="bg-grid" /></div>

      <header className="landing-nav">
        <div className="landing-logo"><span className="logo-icon"><Shield size={20} /></span><strong>DepthGuard</strong></div>
        <div className="landing-badges">
          <span className="track-badge">Track 3 — Security & Compliance</span>
          <span className="hack-badge">Web Data UNLOCKED</span>
        </div>
      </header>

      <main className="landing-hero">
        <div className="landing-hero-content">
          <div className="hero-eyebrow"><ShieldAlert size={16} /><span>Autonomous Supply Chain Threat Agent</span></div>
          <h1 className="landing-title">
            Find supply chain threats<br />
            <span className="gradient-text">before CVEs sync</span>
          </h1>
          <p className="landing-desc">
            DepthGuard is an AI agent that combines <strong>OSV + GitHub advisories</strong> with
            <strong> Bright Data SERP API</strong> (10 live Google queries per scan) to detect compromised packages,
            typosquats, and exploit chatter — then <strong>AI/ML API</strong> writes an executive brief in seconds.
          </p>
          <div className="landing-cta-row">
            <button className="cta-primary" onClick={onEnter}><Zap size={18} />Launch Agent Dashboard<ArrowRight size={18} /></button>
            <span className="cta-hint">Judge demo: event-stream supply chain attack →</span>
          </div>
          <div className="landing-tools">
            <span className="tools-label">Powered by:</span>
            {primitives.map(({ label, Icon }) => (
              <span className="tool-chip" key={label}><Icon size={14} />{label}</span>
            ))}
          </div>
        </div>

        <div className="landing-visual">
          <div className="shield-visual">
            <div className="shield-core"><Shield size={40} /></div>
            <div className="shield-ring r1" /><div className="shield-ring r2" /><div className="shield-ring r3" />
            <div className="threat-float t1"><Bug size={14} /><span>CVE-2024-3094</span></div>
            <div className="threat-float t2"><Package size={14} /><span>Prototype pollution</span></div>
            <div className="threat-float t3"><AlertTriangle size={14} /><span>Path traversal</span></div>
          </div>
          <div className="landing-stats">
            {stats.map((s, i) => (
              <div className={`stat-card ${i < visibleStats ? 'visible' : ''}`} key={s.label}>
                <strong>{s.value}</strong><span>{s.label}</span><small>{s.sub}</small>
              </div>
            ))}
          </div>
        </div>
      </main>

      <section className="landing-how">
        <h2>How the agent works — <span className="gradient-text">6-stage pipeline</span></h2>
        <div className="how-steps">
          <div className="how-step">
            <div className="how-num">1</div>
            <h3>Import your stack</h3>
            <p>Paste <strong>package.json</strong> or scan any package. The agent queues dependencies across npm, PyPI, Go, and Maven.</p>
          </div>
          <div className="how-arrow"><ArrowRight size={20} /></div>
          <div className="how-step">
            <div className="how-num">2</div>
            <h3>Bright Data live web</h3>
            <p><strong>SERP API</strong> searches Google for supply chain signals. <strong>Web Unlocker</strong> scrapes bot-protected security blogs for evidence OSV cannot reach.</p>
          </div>
          <div className="how-arrow"><ArrowRight size={20} /></div>
          <div className="how-step">
            <div className="how-num">3</div>
            <h3>AI executive brief</h3>
            <p><strong>AI/ML API</strong> correlates structured CVEs + live web evidence into a cited threat brief with remediation steps for DevSecOps.</p>
          </div>
        </div>
      </section>

      <section className="landing-problem">
        <div className="problem-card">
          <h2>The problem is real</h2>
          <div className="problem-stats">
            <div><strong>700%</strong><span>increase in supply chain attacks since 2020</span></div>
            <div><strong>$46B</strong><span>cost of software supply chain attacks in 2024</span></div>
            <div><strong>11 days</strong><span>average time to detect a compromised package</span></div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <button className="cta-primary" onClick={onEnter}><Zap size={18} />Launch Dashboard<ArrowRight size={18} /></button>
      </footer>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   AGENT BRIEF BANNER
   ═══════════════════════════════════════════════ */

function AgentBriefBanner({ brief, onDismiss }: { brief: string | null; onDismiss: () => void }) {
  if (!brief) return null
  return (
    <div className="agent-brief-banner fadeIn">
      <div className="abb-head">
        <Sparkles size={18} />
        <strong>Latest AI Threat Brief</strong>
        <button type="button" className="abb-close" onClick={onDismiss} aria-label="Dismiss"><X size={16} /></button>
      </div>
      <div className="abb-body">{brief.split('\n').slice(0, 6).map((line, i) => <p key={i}>{line}</p>)}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   TAB: WEB INTEL — Bright Data live signals
   ═══════════════════════════════════════════════ */

function WebIntelTab({ signals, scans }: { signals: WebSignal[]; scans: ScanRecordLite[] }) {
  const [filter, setFilter] = useState<'all' | 'serp' | 'unlocker'>('all')
  const filtered = filter === 'all' ? signals : signals.filter((s) => s.source === filter)

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <span className="label">Bright Data live web</span>
          <h1>Web Intelligence Signals</h1>
          <p className="page-sub">Every URL below was collected via <strong>Bright Data SERP API</strong> or <strong>Web Unlocker</strong> during agent scans.</p>
        </div>
      </div>

      <section className="metric-grid">
        <div className="metric-tile"><span>Total signals</span><strong>{signals.length}</strong><small className="up">live scraped</small></div>
        <div className="metric-tile"><span>SERP results</span><strong>{signals.filter((s) => s.source === 'serp').length}</strong><small>Google via BD</small></div>
        <div className="metric-tile"><span>Unlocked pages</span><strong>{signals.filter((s) => s.source === 'unlocker').length}</strong><small>Web Unlocker</small></div>
        <div className="metric-tile"><span>Scans w/ web data</span><strong>{scans.filter((s) => s.webSignals.length > 0).length}</strong><small>agent runs</small></div>
      </section>

      <div className="seg-ctrl">
        {(['all', 'serp', 'unlocker'] as const).map((f) => (
          <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
            {f === 'all' ? `All (${signals.length})` : f === 'serp' ? 'SERP API' : 'Web Unlocker'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><Globe size={40} /><h3>No web signals yet</h3><p>Run a scan in the Scanning tab — Bright Data results appear here with live URLs.</p></div>
      ) : (
        <div className="web-intel-grid">
          {filtered.map((s) => (
            <article className="web-intel-card" key={s.url}>
              <div className="wi-head">
                <span className={`wi-src wi-${s.source}`}>{s.source === 'serp' ? 'SERP API' : 'Web Unlocker'}</span>
                <a href={s.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /></a>
              </div>
              <h3>{s.title}</h3>
              <p>{s.snippet || s.extractedText?.slice(0, 200) || 'No snippet'}</p>
              {s.aiVerdict && <span className="ai-tag">AI/ML: {s.aiVerdict} · {s.aiRelevance ?? 0}/100 relevance</span>}
              <a className="wi-link" href={s.url} target="_blank" rel="noopener noreferrer">{s.url.replace('https://', '').slice(0, 55)}…</a>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

type ScanRecordLite = { pkg: string; webSignals: WebSignal[] }

/* ═══════════════════════════════════════════════
   TAB 1: THREAT FEED — shows all real threats
   ═══════════════════════════════════════════════ */

function ThreatFeedTab({ threats, scans, totalScanned, initializing, activeScanPkgs, webSignalCount, earlyWarnings }: {
  threats: LiveThreat[]
  scans: { pkg: string; ecosystem: string; timestamp: number; threats: LiveThreat[]; durationMs: number }[]
  totalScanned: number
  initializing: boolean
  activeScanPkgs: string[]
  webSignalCount: number
  earlyWarnings: number
}) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')

  const filtered = filter === 'all' ? threats : threats.filter((t) => t.severity === filter)
  const selected = filtered[selectedIdx] ?? filtered[0]

  const counts = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0 }
    threats.forEach((t) => c[t.severity]++)
    return c
  }, [threats])

  return (
    <>
      {/* Metrics */}
      <section className="metric-grid">
        <div className="metric-tile">
          <span>Total CVEs found</span><strong>{threats.length}</strong>
          <small className="up">{initializing ? <><Loader2 size={13} className="spin" /> scanning...</> : 'from live APIs'}</small>
        </div>
        <div className="metric-tile">
          <span>Critical</span><strong className={counts.critical > 0 ? 'crit-text' : ''}>{counts.critical}</strong>
          <small className="down">requires immediate action</small>
        </div>
        <div className="metric-tile">
          <span>Packages scanned</span><strong>{totalScanned}</strong>
          <small className="up">{activeScanPkgs.length > 0 ? `${activeScanPkgs.length} in progress` : 'complete'}</small>
        </div>
        <div className="metric-tile">
          <span>Web signals (BD)</span><strong>{webSignalCount}</strong>
          <small className="up">SERP + Web Unlocker</small>
        </div>
        <div className="metric-tile">
          <span>Early warnings</span><strong className={earlyWarnings > 0 ? 'crit-text' : ''}>{earlyWarnings}</strong>
          <small className="down">before CVE sync</small>
        </div>
      </section>

      {/* Main grid */}
      <section className="main-grid">
        <section className="card">
          <div className="card-head"><div><span className="label">Live data</span><h2>Real Vulnerabilities</h2></div></div>

          <div className="seg-ctrl">
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map((f) => (
              <button key={f} className={filter === f ? 'active' : ''} onClick={() => { setFilter(f); setSelectedIdx(0) }}>
                {f === 'all' ? `All (${threats.length})` : `${f} (${counts[f]})`}
              </button>
            ))}
          </div>

          <div className="q-head"><span>CVE / Package</span><span>Ecosystem</span><span>Score</span><span>Severity</span></div>
          <div className="q-list">
            {filtered.length === 0 && (
              <div className="q-empty">{initializing ? <><Loader2 size={16} className="spin" />Scanning packages...</> : 'No threats in this category'}</div>
            )}
            {filtered.slice(0, 30).map((t, i) => (
              <button key={t.id} className={`q-row ${i === selectedIdx ? 'sel' : ''}`} onClick={() => setSelectedIdx(i)}>
                <span className="q-main">
                  <span className="q-name">
                    <span className="eco-tag">{t.ecosystem}</span>
                    {t.earlyWarning && <span className="eco-tag" style={{ background: 'rgba(251,191,36,.15)', color: 'var(--amber)' }}>EARLY</span>}
                    {t.cveId ?? t.id}
                  </span>
                  <span className="q-sub">{t.title}</span>
                </span>
                <span className="q-cat">{t.package}</span>
                <RiskBar score={t.score} />
                <SevPill severity={t.severity} />
              </button>
            ))}
          </div>
        </section>

        {/* Detail panel */}
        {selected && (
          <aside className="card detail-card">
            <div className="card-head"><div><span className="label">Threat detail</span><h2>{selected.cveId ?? selected.id}</h2></div><SevPill severity={selected.severity} /></div>
            <div className="score-orbit">
              <div className={`score-ring ${selected.severity === 'critical' ? 'critical' : selected.severity === 'high' ? 'warn' : 'safe'}`}>
                <strong>{selected.score}</strong><span>/ 100</span>
              </div>
              <div className="score-info">
                <div><span>Package</span><strong>{selected.package}</strong></div>
                <div><span>Ecosystem</span><strong>{selected.ecosystem}</strong></div>
                <div><span>Affects</span><strong>{selected.affectsVersions}</strong></div>
                <div><span>Fixed in</span><strong className={selected.fixedIn ? 'fix-text' : 'crit-text'}>{selected.fixedIn ?? 'No fix'}</strong></div>
              </div>
            </div>
            <div className="src-tags">
              <span className="src-tag">{selected.source}</span>
              {selected.brightDataSource && <span className="src-tag">{selected.brightDataSource}</span>}
              {selected.cveId && <span className="src-tag">{selected.cveId}</span>}
            </div>
            <p className="desc-box">{selected.description || 'No description available.'}</p>
            {selected.references.length > 0 && (
              <div className="ref-links">
                {selected.references.slice(0, 4).map((r) => (
                  <a key={r} href={r} target="_blank" rel="noopener noreferrer" className="lr-ref"><ExternalLink size={12} />{r.replace('https://', '').slice(0, 50)}</a>
                ))}
              </div>
            )}
          </aside>
        )}
      </section>

      {/* Scan history */}
      <section className="card">
        <div className="card-head compact"><div><span className="label">Scan history</span><h2>Recent scans</h2></div><Clock3 size={18} /></div>
        <div className="tl">
          {scans.slice(0, 6).map((s) => (
            <article key={s.pkg + s.timestamp} className="tl-item">
              <span className="tl-dot"><Database size={14} /></span>
              <div>
                <time>{new Date(s.timestamp).toLocaleTimeString()}</time>
                <h3>Scanned <strong>{s.pkg}</strong> ({s.ecosystem})</h3>
                <p>Found {s.threats.length} vulnerabilities in {s.durationMs}ms</p>
              </div>
            </article>
          ))}
          {scans.length === 0 && <p className="q-empty">{initializing ? <><Loader2 size={16} className="spin" />Auto-scanning packages...</> : 'No scans yet'}</p>}
        </div>
      </section>
    </>
  )
}

/* ═══════════════════════════════════════════════
   TAB 2: STACKS — import package.json
   ═══════════════════════════════════════════════ */

function StacksTab({ scans, onImport, initializing }: {
  scans: { pkg: string; ecosystem: string; timestamp: number; threats: LiveThreat[]; durationMs: number }[]
  onImport: (json: string) => Promise<number>
  initializing: boolean
}) {
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [jsonInput, setJsonInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const doImport = useCallback(async (text: string) => {
    setImporting(true)
    setImportResult(null)
    try {
      const count = await onImport(text)
      setImportResult(`✅ Scanning ${count} dependencies...`)
      setJsonInput('')
    } catch (e) {
      setImportResult(`❌ ${String(e)}`)
    } finally {
      setImporting(false)
    }
  }, [onImport])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => doImport(reader.result as string)
    reader.readAsText(file)
  }, [doImport])

  // Group scans by package
  const pkgMap = useMemo(() => {
    const m = new Map<string, { pkg: string; eco: string; vulns: number; lastScan: number; duration: number }>()
    for (const s of scans) {
      const existing = m.get(s.pkg)
      if (!existing || s.timestamp > existing.lastScan) {
        m.set(s.pkg, { pkg: s.pkg, eco: s.ecosystem, vulns: s.threats.length, lastScan: s.timestamp, duration: s.durationMs })
      }
    }
    return Array.from(m.values()).sort((a, b) => b.vulns - a.vulns)
  }, [scans])

  return (
    <section className="page">
      <div className="page-head">
        <div><span className="label">Your dependencies</span><h1>Monitored Packages</h1>
          <p className="page-sub">Import a <strong>package.json</strong> to scan all dependencies, or view results from auto-scanned packages.</p></div>
      </div>

      {/* Import section */}
      <div className="import-section">
        <div className="import-card">
          <Upload size={24} />
          <h3>Import package.json</h3>
          <p>Upload or paste your package.json to scan all dependencies at once.</p>
          <div className="import-actions">
            <input ref={fileRef} type="file" accept=".json" onChange={handleFile} style={{ display: 'none' }} />
            <button className="btn-primary" onClick={() => fileRef.current?.click()} disabled={importing}>
              {importing ? <><Loader2 size={16} className="spin" />Scanning...</> : <><Upload size={16} />Upload file</>}
            </button>
          </div>
          <textarea className="json-textarea" placeholder='Or paste package.json contents here...' value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)} rows={4} />
          {jsonInput.trim() && (
            <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => doImport(jsonInput)} disabled={importing}>
              <Zap size={16} />Scan pasted JSON
            </button>
          )}
          {importResult && <p className="import-result">{importResult}</p>}
        </div>
      </div>

      {/* Package grid */}
      {pkgMap.length > 0 && (
        <div className="stacks-grid">
          {pkgMap.map((p) => {
            const cls = p.vulns > 5 ? 'risk' : p.vulns > 0 ? 'scan' : 'ok'
            return (
              <div className="stack-card" key={p.pkg}>
                <div className="stack-icon"><Package size={28} /></div>
                <h3>{p.pkg}</h3><p className="stack-fw">{p.eco}</p>
                <div className="stack-row">
                  <div><span>Vulns</span><strong className={cls}>{p.vulns}</strong></div>
                  <div><span>Scan time</span><strong>{p.duration}ms</strong></div>
                  <div><span>Last scan</span><strong>{new Date(p.lastScan).toLocaleTimeString()}</strong></div>
                </div>
                <div className="dep-bar"><div style={{ width: `${Math.max(5, 100 - p.vulns * 5)}%` }} /></div>
                <span className={`status-badge ${cls}`}>
                  {cls === 'ok' ? <CheckCircle2 size={14} /> : cls === 'scan' ? <AlertTriangle size={14} /> : <XCircle size={14} />}
                  {p.vulns === 0 ? 'clean' : `${p.vulns} vulnerabilities`}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {pkgMap.length === 0 && (
        <div className="empty-state">
          {initializing ? <><Loader2 size={40} className="spin" /><h3>Auto-scanning popular packages...</h3><p>Results will appear here as scans complete.</p></>
            : <><Package size={40} /><h3>No packages scanned yet</h3><p>Import a package.json or go to the Scanning tab.</p></>}
        </div>
      )}

      <div className="info-box"><Shield size={20} /><div><h3>{pkgMap.length} packages tracked</h3><p>All data from live API queries to OSV.dev, GitHub Advisory DB, and package registries.</p></div></div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   TAB 3: SCANNING — scan individual packages
   ═══════════════════════════════════════════════ */

function ScanningTab({ onScan, autoRunTrigger }: {
  onScan: (pkg: string, eco: string, onProgress: (steps: PipelineStep[]) => void) => Promise<{
    threats: LiveThreat[]
    webSignals?: WebSignal[]
    agentBrief?: string
    whyNow?: { score: number; reason: string; gap: string }
    remediationPlan?: string[]
    agents?: { id: string; name: string; role: string; status: string }[]
    slackAlert?: { sent: boolean; reason?: string }
    serpStats?: { queriesRun: number; resultsFound: number }
    steps?: PipelineStep[]
  }>
  autoRunTrigger?: number
}) {
  const [pkg, setPkg] = useState('event-stream')
  const [eco, setEco] = useState('npm')
  const [steps, setSteps] = useState<PipelineStep[]>([])
  const [results, setResults] = useState<LiveThreat[]>([])
  const [webSignals, setWebSignals] = useState<WebSignal[]>([])
  const [agentBrief, setAgentBrief] = useState<string | null>(null)
  const [whyNow, setWhyNow] = useState<{ score: number; reason: string; gap: string } | null>(null)
  const [remediation, setRemediation] = useState<string[]>([])
  const [agents, setAgents] = useState<{ id: string; name: string; role: string; status: string }[]>([])
  const [slackAlert, setSlackAlert] = useState<{ sent: boolean; reason?: string } | null>(null)
  const [serpStats, setSerpStats] = useState<{ queriesRun: number; resultsFound: number } | null>(null)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const lastAutoRun = useRef(0)

  const applyResult = useCallback((record: {
    threats: LiveThreat[]
    webSignals?: WebSignal[]
    agentBrief?: string
    whyNow?: { score: number; reason: string; gap: string }
    remediationPlan?: string[]
    agents?: { id: string; name: string; role: string; status: string }[]
    slackAlert?: { sent: boolean; reason?: string }
    serpStats?: { queriesRun: number; resultsFound: number }
    steps?: PipelineStep[]
  }) => {
    setResults(record.threats)
    setWebSignals(record.webSignals ?? [])
    setAgentBrief(record.agentBrief ?? null)
    setWhyNow(record.whyNow ?? null)
    setRemediation(record.remediationPlan ?? [])
    setAgents(record.agents ?? [])
    setSlackAlert(record.slackAlert ?? null)
    setSerpStats(record.serpStats ?? null)
    if (record.steps?.length) setSteps(record.steps)
    setDone(true)
  }, [])

  const startScan = useCallback(async (overridePkg?: string, overrideEco?: string) => {
    const targetPkg = overridePkg ?? pkg
    const targetEco = overrideEco ?? eco
    if (overridePkg) setPkg(overridePkg)
    if (overrideEco) setEco(overrideEco)
    setRunning(true); setDone(false); setError(null); setResults([]); setWebSignals([]); setAgentBrief(null); setWhyNow(null); setRemediation([]); setAgents([]); setSlackAlert(null); setSerpStats(null); setSteps([]); setExpandedId(null)
    try {
      const record = await onScan(targetPkg, targetEco, setSteps)
      applyResult(record)
    } catch (e) { setError(String(e)) } finally { setRunning(false) }
  }, [pkg, eco, onScan, applyResult])

  const runJudgeDemo = useCallback(async () => {
    setPkg('event-stream'); setEco('npm')
    setRunning(true); setDone(false); setError(null); setResults([]); setWebSignals([]); setAgentBrief(null); setWhyNow(null); setRemediation([]); setAgents([]); setSlackAlert(null); setSerpStats(null); setSteps([]); setExpandedId(null)
    try {
      const { fetchDemoCache } = await import('./api')
      const cached = await fetchDemoCache()
      if (cached) {
        applyResult(cached)
        return
      }
      const record = await onScan('event-stream', 'npm', setSteps)
      applyResult(record)
    } catch (e) { setError(String(e)) } finally { setRunning(false) }
  }, [onScan, applyResult])

  useEffect(() => {
    if (autoRunTrigger && autoRunTrigger !== lastAutoRun.current) {
      lastAutoRun.current = autoRunTrigger
      runJudgeDemo()
    }
  }, [autoRunTrigger, runJudgeDemo])

  const iconForTool = (tool: string) => {
    if (tool.includes('Bright Data SERP')) return Search
    if (tool.includes('Web Unlocker')) return Globe
    if (tool.includes('AI/ML')) return Sparkles
    if (tool.includes('OSV')) return Database
    if (tool.includes('GitHub')) return Globe
    return Terminal
  }

  const critCount = results.filter((r) => r.severity === 'critical').length
  const highCount = results.filter((r) => r.severity === 'high').length

  return (
    <section className="page">
      <div className="page-head">
        <div><span className="label">Autonomous agent</span><h1>Scan Any Package</h1>
          <p className="page-sub">5-agent LangGraph swarm: OSV Scout → GitHub Sentinel → SERP Hunter → Intel Analyst → Response Commander (Slack + SIEM).</p></div>
      </div>

      <div className="scan-input-row">
        <div className="scan-input-wrap">
          <Search size={16} />
          <input className="scan-input" type="text" placeholder="Package name (e.g. lodash, express)" value={pkg} onChange={(e) => setPkg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !running && startScan()} />
        </div>
        <div className="seg-ctrl">
          {['npm', 'PyPI', 'Go', 'crates.io', 'Maven'].map((e) => (
            <button key={e} className={eco === e ? 'active' : ''} onClick={() => setEco(e)}>{e}</button>
          ))}
        </div>
        <button className="btn-primary scan-cta" disabled={running || !pkg.trim()} onClick={() => startScan()}>
          {running ? <><Loader2 size={16} className="spin" />Scanning…</> : <><Zap size={16} />Scan Now</>}
        </button>
        <button className="btn-judge" disabled={running} onClick={runJudgeDemo} type="button">
          {running ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}Judge Demo
        </button>
      </div>

      <div className="quick-picks">
        <span className="qp-label">Try:</span>
        {[{ n: 'event-stream', e: 'npm' }, { n: 'ua-parser-js', e: 'npm' }, { n: 'lodash', e: 'npm' }, { n: 'jsonwebtoken', e: 'npm' }, { n: 'tar', e: 'npm' }, { n: 'axios', e: 'npm' }, { n: 'django', e: 'PyPI' }, { n: 'requests', e: 'PyPI' }].map((p) => (
          <button key={p.n} className="qp-btn" onClick={() => { setPkg(p.n); setEco(p.e) }}>{p.n}<span className="eco-tag">{p.e}</span></button>
        ))}
      </div>

      {steps.length > 0 && (
        <div className="pipeline">
          {steps.map((s, i) => {
            const SIcon = iconForTool(s.tool)
            return (
              <div className={`pipe-step ${s.status === 'done' ? 'done' : s.status === 'running' ? 'active' : s.status === 'error' ? 'err' : 'wait'}`} key={i}>
                <div className="pipe-num">{s.status === 'done' ? <Check size={16} /> : s.status === 'running' ? <Loader2 size={16} className="spin" /> : s.status === 'error' ? <X size={16} /> : <span>{i + 1}</span>}</div>
                <div className="pipe-content">
                  <div className="pipe-tool"><SIcon size={14} />{s.tool}{s.duration ? <span className="pipe-ms">{s.duration}ms</span> : null}</div>
                  <p>{s.action}</p>
                  {s.status === 'done' && s.result != null ? (
                    <span className="pipe-result">{JSON.stringify(s.result)}</span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {error && <div className="scan-error"><AlertTriangle size={16} /><span>{error}</span></div>}

      {done && agents.length > 0 && (
        <div className="card agent-swarm fadeIn">
          <div className="card-head compact"><div><span className="label">Multi-agent swarm</span><h2>5 Agents Deployed</h2></div></div>
          <div className="swarm-grid">
            {agents.map((a) => (
              <div className={`swarm-agent ${a.status}`} key={a.id}>
                <strong>{a.name}</strong>
                <span>{a.role}</span>
                <em className={`swarm-status ${a.status}`}>{a.status}</em>
              </div>
            ))}
          </div>
          <div className="alert-actions">
            {slackAlert?.sent ? (
              <span className="pill safe"><Check size={13} />Slack alert dispatched</span>
            ) : (
              <span className="pill warn"><AlertTriangle size={13} />Slack: {slackAlert?.reason ?? 'not configured — add SLACK_WEBHOOK_URL'}</span>
            )}
            <button type="button" className="btn-primary" onClick={() => {
              window.open(`/api/siem/${encodeURIComponent(pkg)}?ecosystem=${encodeURIComponent(eco)}`, '_blank')
            }}><FileText size={14} />Export SIEM JSON</button>
            <button type="button" className="btn-ghost" onClick={() => {
              window.open(`/api/report/${encodeURIComponent(pkg)}?ecosystem=${encodeURIComponent(eco)}`, '_blank')
            }}><FileText size={14} />Judge Report (MD)</button>
          </div>
        </div>
      )}

      {done && (
        <div className="fadeIn">
          <div className={`scan-result ${results.length > 0 ? '' : 'safe-result'}`}>
            <div className="scan-head">
              {results.length > 0 ? <XCircle size={24} className="crit-icon" /> : <ShieldCheck size={24} className="safe-icon" />}
              <div><h3>{results.length > 0 ? `${results.length} VULNERABILITIES FOUND` : 'NO VULNERABILITIES FOUND'}</h3><p>{pkg}@latest — {eco}</p></div>
              {critCount > 0 && <span className="pill critical"><X size={13} />{critCount} CRITICAL</span>}
              {highCount > 0 && <span className="pill warn"><AlertTriangle size={13} />{highCount} HIGH</span>}
            </div>
            <div className="scan-stats">
              <div><span>Total CVEs</span><strong>{results.length}</strong></div>
              <div><span>Critical</span><strong className={critCount > 0 ? 'crit-text' : ''}>{critCount}</strong></div>
              <div><span>High</span><strong>{highCount}</strong></div>
              <div><span>Web signals</span><strong>{webSignals.length}</strong></div>
              {serpStats && <div><span>SERP queries</span><strong>{serpStats.queriesRun}</strong></div>}
              <div><span>Agent</span><strong>AI/ML API</strong></div>
            </div>
          </div>

          {whyNow && (
            <div className="card why-now-card fadeIn">
              <div className="card-head compact"><div><span className="label">AI/ML API</span><h2>Why-Now Score</h2></div></div>
              <div className="why-now-body">
                <div className={`score-ring ${whyNow.score >= 70 ? 'critical' : whyNow.score >= 40 ? 'warn' : 'safe'}`}>
                  <strong>{whyNow.score}</strong><span>/ 100</span>
                </div>
                <div><p><strong>{whyNow.reason}</strong></p><p className="why-gap">{whyNow.gap}</p></div>
              </div>
            </div>
          )}

          {agentBrief && (
            <div className="card agent-brief-card fadeIn">
              <div className="card-head compact"><div><span className="label">AI/ML API</span><h2>Executive Threat Brief</h2></div><Sparkles size={18} /></div>
              <div className="agent-brief-body">{agentBrief.split('\n').map((line, i) => <p key={i}>{line}</p>)}</div>
            </div>
          )}

          {remediation.length > 0 && (
            <div className="card fadeIn">
              <div className="card-head compact"><div><span className="label">AI/ML API</span><h2>Remediation Plan</h2></div><Sparkles size={18} /></div>
              <ol className="remediation-list">
                {remediation.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
            </div>
          )}

          {webSignals.length > 0 && (
            <div className="live-results">
              <h3 className="lr-title">Bright Data + <strong>AI-classified</strong> signals for <strong>{pkg}</strong>:</h3>
              {webSignals.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="lr-ref web-signal-row">
                  <ExternalLink size={12} />
                  <div>
                    <strong>{s.title}</strong>
                    {s.aiVerdict && <span className="ai-tag">AI: {s.aiVerdict} ({s.aiRelevance ?? '—'}/100)</span>}
                    <span>{s.snippet?.slice(0, 120) || s.source}</span>
                  </div>
                </a>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="live-results">
              <h3 className="lr-title">Real CVEs for <strong>{pkg}</strong>:</h3>
              {results.map((t) => {
                const isOpen = expandedId === t.id
                return (
                  <div className={`lr-card ${isOpen ? 'open' : ''}`} key={t.id}>
                    <button className="lr-head" onClick={() => setExpandedId(isOpen ? null : t.id)}>
                      <span className={`sev-dot sev-${t.severity}`} />
                      <div className="lr-info"><h4>{t.cveId ?? t.id}</h4><p>{t.title}</p></div>
                      <span className="lr-score">{t.score}</span>
                      <SevPill severity={t.severity} />
                      <ChevronDown size={16} className={`inc-chev ${isOpen ? 'rot' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="lr-body fadeIn">
                        <div className="inc-meta">
                          <div><span>CVE</span><strong>{t.cveId ?? 'N/A'}</strong></div>
                          <div><span>Score</span><strong>{t.score}/100</strong></div>
                          <div><span>Affects</span><strong>{t.affectsVersions}</strong></div>
                          <div><span>Fixed in</span><strong className={t.fixedIn ? 'fix-text' : 'crit-text'}>{t.fixedIn ?? 'No fix'}</strong></div>
                        </div>
                        <p className="inc-desc">{t.description}</p>
                        {t.references.length > 0 && (
                          <div className="lr-refs"><h4>References:</h4>
                            {t.references.map((r) => <a key={r} href={r} target="_blank" rel="noopener noreferrer" className="lr-ref"><ExternalLink size={12} />{r.replace('https://', '').slice(0, 60)}</a>)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {!running && !done && steps.length === 0 && (
        <div className="empty-state"><Zap size={40} /><h3>Type a package and hit "Scan Now"</h3><p>Autonomous agent runs OSV + Bright Data + AI/ML API. Try <strong>event-stream</strong> for supply chain demo.</p></div>
      )}
    </section>
  )
}

/* ═══════════════════════════════════════════════
   TAB 4: INCIDENTS — real CVEs grouped by severity
   ═══════════════════════════════════════════════ */

function IncidentsTab({ threats }: { threats: LiveThreat[] }) {
  const criticals = threats.filter((t) => t.severity === 'critical' || t.severity === 'high')
  const [open, setOpen] = useState<string | null>(criticals[0]?.id ?? null)

  return (
    <section className="page">
      <div className="page-head"><div><span className="label">Critical & high severity</span><h1>Security Incidents</h1>
        <p className="page-sub">{criticals.length} high/critical CVEs found across all scanned packages.</p></div></div>

      {criticals.length === 0 && (
        <div className="empty-state"><ShieldCheck size={40} /><h3>No critical or high severity vulnerabilities</h3><p>All scanned packages are clean. Scan more packages to expand coverage.</p></div>
      )}

      <div className="inc-list">
        {criticals.map((t) => {
          const isOpen = open === t.id
          return (
            <div className={`inc-card ${isOpen ? 'open' : ''}`} key={t.id}>
              <button className="inc-head" onClick={() => setOpen(isOpen ? null : t.id)}>
                <span className={`sev-dot sev-${t.severity}`} />
                <div className="inc-title"><h3>{t.package} <span className="eco-tag">{t.ecosystem}</span></h3><p>{t.cveId ?? t.id}: {t.title}</p></div>
                <SevPill severity={t.severity} />
                <ChevronDown size={18} className={`inc-chev ${isOpen ? 'rot' : ''}`} />
              </button>
              {isOpen && (
                <div className="inc-body fadeIn">
                  <div className="inc-meta">
                    <div><span>CVE</span><strong>{t.cveId ?? 'N/A'}</strong></div>
                    <div><span>Score</span><strong>{t.score}/100</strong></div>
                    <div><span>Affects</span><strong>{t.affectsVersions}</strong></div>
                    <div><span>Fixed in</span><strong className={t.fixedIn ? 'fix-text' : 'crit-text'}>{t.fixedIn ?? 'No fix'}</strong></div>
                  </div>
                  <p className="inc-desc">{t.description}</p>
                  {t.references.length > 0 && (
                    <div className="lr-refs"><h4>References:</h4>
                      {t.references.map((r) => <a key={r} href={r} target="_blank" rel="noopener noreferrer" className="lr-ref"><ExternalLink size={12} />{r.replace('https://', '').slice(0, 60)}</a>)}
                    </div>
                  )}
                  <span className="lr-source">Source: {t.source} · Published: {t.publishedDate ? new Date(t.publishedDate).toLocaleDateString() : 'Unknown'}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   TAB 5: AUDIT — real scan log
   ═══════════════════════════════════════════════ */

function AuditTab({ scans }: {
  scans: { pkg: string; ecosystem: string; timestamp: number; threats: LiveThreat[]; durationMs: number }[]
}) {
  return (
    <section className="page">
      <div className="page-head"><div><span className="label">Complete history</span><h1>Audit Log</h1>
        <p className="page-sub">Every scan is logged with timestamps, sources queried, and results.</p></div></div>

      {scans.length === 0 && (
        <div className="empty-state"><Clock3 size={40} /><h3>No scans recorded yet</h3><p>Scans will appear here as they complete.</p></div>
      )}

      <div className="audit-list">
        {scans.map((s) => (
          <article className="audit-entry" key={s.pkg + s.timestamp}>
            <div className="audit-time">
              <time>{new Date(s.timestamp).toLocaleTimeString()}</time>
              <span className="audit-dot">{s.threats.length > 0 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}</span>
            </div>
            <div>
              <h3>Scanned <strong>{s.pkg}</strong> ({s.ecosystem})</h3>
              <p>
                Found <strong className={s.threats.length > 0 ? 'crit-text' : 'fix-text'}>{s.threats.length} vulnerabilities</strong> in {s.durationMs}ms.
                Sources: OSV.dev, GitHub Advisory DB, {s.ecosystem === 'npm' ? 'npm Registry' : s.ecosystem + ' Registry'}.
                {s.threats.filter((t) => t.severity === 'critical').length > 0 && <strong className="crit-text"> ({s.threats.filter((t) => t.severity === 'critical').length} critical!)</strong>}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="info-box"><FileText size={20} /><div><h3>Real audit trail</h3><p>Every entry represents a real API call to OSV.dev and GitHub Advisory DB. Export-ready for compliance.</p></div></div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   TAB 6: BRIGHT DATA — pitch integration
   ═══════════════════════════════════════════════ */

function BrightDataTab() {
  return (
    <section className="page">
      <div className="page-head"><div><span className="label">Technology integration</span><h1>Bright Data Products</h1>
        <p className="page-sub">How DepthGuard uses Bright Data products to go beyond public APIs.</p></div></div>
      <div className="bd-grid">
        {brightDataProducts.map((p) => {
          const PIcon = p.Icon
          return (
            <article className="bd-card" key={p.name}>
              <div className="bd-icon"><PIcon size={28} /></div>
              <h3>{p.name}</h3>
              <p className="bd-desc">{p.description}</p>
              <div className="bd-use"><span className="label">How DepthGuard uses it</span><p>{p.useCase}</p></div>
            </article>
          )
        })}
      </div>

      <section className="card why-card">
        <div className="card-head compact"><div><span className="label">Competitive edge</span><h2>Why DepthGuard Wins</h2></div></div>
        <div className="res-grid">
          {researchSignals.map(({ title, detail, source, Icon }) => (
            <article className="res-item" key={title}><Icon size={18} /><div><h3>{title}</h3><p>{detail}</p><span className="res-src">{source}</span></div></article>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head compact"><div><span className="label">Revenue model</span><h2>Business Streams</h2></div></div>
        <div className="biz-grid">
          <div className="biz-card"><DollarSign size={22} /><h3>SaaS per stack</h3><p>$299–2,999/mo per monitored repo.</p></div>
          <div className="biz-card"><Users size={22} /><h3>Enterprise tier</h3><p>Custom pricing for 50+ repos. SSO, RBAC, SOC 2.</p></div>
          <div className="biz-card"><TrendingUp size={22} /><h3>Threat intel API</h3><p>Sell aggregated threat intelligence to vendors.</p></div>
        </div>
      </section>
      <div className="notes">{marketNotes.map((n) => <p key={n}>{n}</p>)}</div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   DASHBOARD SHELL
   ═══════════════════════════════════════════════ */

const tabMap: Record<number, TabId> = { 0: 'feed', 1: 'webintel', 2: 'stacks', 3: 'scanning', 4: 'incidents', 5: 'audit', 6: 'brightdata' }

function Dashboard({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<TabId>('feed')
  const [briefDismissed, setBriefDismissed] = useState(false)
  const [judgeDemoTrigger, setJudgeDemoTrigger] = useState(0)
  const { state, scanPackage, initialize, scanPackageJson } = useScanStore()

  // Auto-scan on mount
  useEffect(() => { initialize() }, [initialize])

  return (
    <main className="dash">
      <aside className="sidebar">
        <button className="brand" onClick={onBack} type="button">
          <span className="logo-icon sm"><Shield size={16} /></span>
          <div><strong>DepthGuard</strong><span>Live Intelligence</span></div>
        </button>
        <nav className="nav">
          {navItems.map(({ label, Icon }, i) => (
            <button key={label} className={tab === tabMap[i] ? 'active' : ''} onClick={() => setTab(tabMap[i])}>
              <Icon size={17} /><span>{label}</span>
              {i === 0 && state.allThreats.length > 0 && <span className="nav-badge">{state.allThreats.length}</span>}
              {i === 1 && state.allWebSignals.length > 0 && <span className="nav-badge" style={{ background: 'rgba(34,211,238,.15)', color: 'var(--cyan)' }}>{state.allWebSignals.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-info">
          <span className="label">Integrations</span>
          <strong>{state.integrations.brightData ? '✅ Bright Data SERP live' : '⚠️ add SERP keys to .env.secrets'}</strong>
          <p>{state.integrations.aiml ? 'AI/ML API active' : 'AI/ML: fallback'} · {state.allWebSignals.length} SERP signals</p>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="cmd-box"><Search size={16} /><span>Search CVEs, packages</span><kbd>⌘K</kbd></div>
          <div className="top-actions">
            <button className="btn-ghost">
              {state.initializing || state.activeScanPkgs.length > 0
                ? <><Radio size={15} className="live-dot" />Scanning {state.activeScanPkgs.length} pkg{state.activeScanPkgs.length !== 1 ? 's' : ''}...</>
                : <><CheckCircle2 size={15} className="fix-text" />All scans complete</>}
            </button>
            <button className="btn-judge" onClick={() => { setTab('scanning'); setJudgeDemoTrigger((n) => n + 1) }} type="button">
              <Sparkles size={16} />Judge Demo
            </button>
            <button className="btn-primary" onClick={() => setTab('scanning')}><Sparkles size={16} />Scan now</button>
          </div>
        </header>

        {!briefDismissed && state.latestBrief && tab !== 'scanning' && (
          <AgentBriefBanner brief={state.latestBrief} onDismiss={() => setBriefDismissed(true)} />
        )}

        {tab === 'feed' && (
          <ThreatFeedTab
            threats={state.allThreats}
            scans={state.scans}
            totalScanned={state.totalScanned}
            initializing={state.initializing}
            activeScanPkgs={state.activeScanPkgs}
            webSignalCount={state.allWebSignals.length}
            earlyWarnings={state.allThreats.filter((t) => t.earlyWarning).length}
          />
        )}
        {tab === 'webintel' && <WebIntelTab signals={state.allWebSignals} scans={state.scans} />}
        {tab === 'stacks' && <StacksTab scans={state.scans} onImport={scanPackageJson} initializing={state.initializing} />}
        {tab === 'scanning' && <ScanningTab onScan={scanPackage} autoRunTrigger={judgeDemoTrigger} />}
        {tab === 'incidents' && <IncidentsTab threats={state.allThreats} />}
        {tab === 'audit' && <AuditTab scans={state.scans} />}
        {tab === 'brightdata' && <BrightDataTab />}
      </section>
    </main>
  )
}

/* ═══════════════════════════════════════════════
   APP ROOT
   ═══════════════════════════════════════════════ */

export function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing')
  return view === 'landing'
    ? <LandingPage onEnter={() => setView('dashboard')} />
    : <Dashboard onBack={() => setView('landing')} />
}
