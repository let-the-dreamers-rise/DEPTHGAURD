import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Bot,
  CircleAlert,
  Database,
  Eye,
  FileClock,
  FileWarning,
  Globe2,
  Layers,
  Radar,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Unplug,
} from 'lucide-react'

/* ───── Core types ───── */

export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type ThreatStatus = 'active' | 'investigating' | 'mitigated'
export type ThreatCategory = 'malware' | 'backdoor' | 'typosquat' | 'dependency-confusion' | 'cve' | 'data-leak'
export type SourceType = 'github-advisory' | 'nvd' | 'osv' | 'social' | 'darkweb' | 'registry' | 'blog'
export type Decision = 'critical' | 'warn' | 'safe'

export type Threat = {
  id: string
  package: string
  ecosystem: string
  title: string
  category: ThreatCategory
  severity: Severity
  score: number            // 0–100 composite risk
  status: ThreatStatus
  affectsVersion: string
  discoveredAt: string
  sources: SourceType[]
  sourceUrls: string[]
  cveId?: string
  description: string
  evidence: string[]
  brightDataSource: string // which Bright Data product scraped this
}

export type MonitorConfig = {
  scanFrequencyMins: number
  severityThreshold: number   // 0–100, threats below this are muted
  autoBlockCritical: number   // 0–100, auto-block if score > this
  socialSignalWeight: number  // 0–100
  darkwebWeight: number       // 0–100
}

export type ProtectedStack = {
  name: string
  framework: string
  deps: number
  vulnerabilities: number
  lastScan: string
  status: 'protected' | 'at-risk' | 'scanning'
  Icon: LucideIcon
}

export type ResearchSignal = {
  title: string
  detail: string
  source: string
  Icon: LucideIcon
}

/* ───── Default config ───── */

export const startingConfig: MonitorConfig = {
  scanFrequencyMins: 15,
  severityThreshold: 35,
  autoBlockCritical: 85,
  socialSignalWeight: 60,
  darkwebWeight: 72,
}

/* ───── Threat feed (simulated Bright Data scrape results) ───── */

export const threats: Threat[] = [
  {
    id: 'thr_001',
    package: 'colors.js',
    ecosystem: 'npm',
    title: 'Malicious infinite-loop payload in colors@1.4.1',
    category: 'malware',
    severity: 'critical',
    score: 96,
    status: 'active',
    affectsVersion: '>=1.4.1',
    discoveredAt: '14:02:18',
    sources: ['github-advisory', 'social', 'blog'],
    sourceUrls: ['https://github.com/advisories/GHSA-xxxx-0001', 'https://twitter.com/security_alert/status/001'],
    cveId: 'CVE-2025-44012',
    description: 'Maintainer pushed a sabotage commit with an infinite loop that crashes Node processes on import. Bright Data Scraping Browser detected the malicious commit diff on the package registry page.',
    evidence: [
      'Commit diff contains while(true) loop in index.js',
      'Version 1.4.1 released 3 hours ago — abnormal publish cadence',
      'Twitter/X chatter spiked 400% in last 2 hours (SERP API)',
      'Package downloaded 18M times/week — blast radius is extreme',
    ],
    brightDataSource: 'Scraping Browser + SERP API',
  },
  {
    id: 'thr_002',
    package: 'event-stream',
    ecosystem: 'npm',
    title: 'Cryptocurrency wallet stealer via flatmap-stream dependency',
    category: 'backdoor',
    severity: 'critical',
    score: 94,
    status: 'investigating',
    affectsVersion: '3.3.6',
    discoveredAt: '13:48:05',
    sources: ['github-advisory', 'nvd', 'darkweb'],
    sourceUrls: ['https://nvd.nist.gov/vuln/detail/CVE-2025-44013'],
    cveId: 'CVE-2025-44013',
    description: 'A transitive dependency (flatmap-stream) was injected with code targeting Copay Bitcoin wallets. Bright Data Web Unlocker bypassed bot protection on paste sites to extract the original payload.',
    evidence: [
      'Obfuscated AES-encrypted payload in flatmap-stream@0.1.1',
      'New maintainer added 2 weeks ago — social engineering attack',
      'Dark web forum mentions selling access to npm packages (Web Unlocker)',
      'Decrypted payload targets process.env for wallet seed phrases',
    ],
    brightDataSource: 'Web Unlocker + SERP API',
  },
  {
    id: 'thr_003',
    package: 'ua-parser-js',
    ecosystem: 'npm',
    title: 'Hijacked package serving cryptominer and credential stealer',
    category: 'malware',
    severity: 'high',
    score: 82,
    status: 'active',
    affectsVersion: '0.7.29, 0.8.0, 1.0.0',
    discoveredAt: '12:31:42',
    sources: ['registry', 'social', 'blog'],
    sourceUrls: ['https://blog.securityresearcher.com/ua-parser-hijack'],
    description: 'Attacker compromised the maintainer npm account and published versions with preinstall scripts that download a cryptominer (jsextension.exe) and a credential stealer. Bright Data Web Scraper API extracted structured indicators from 12 security blog posts.',
    evidence: [
      'preinstall script downloads binaries from remote server',
      'Three compromised versions published within 4-hour window',
      'Maintainer account had no 2FA enabled (GitHub profile scrape)',
      '12 independent security blogs reporting — cross-referenced via Web Scraper API',
    ],
    brightDataSource: 'Web Scraper API + SERP API',
  },
  {
    id: 'thr_004',
    package: 'crossenv',
    ecosystem: 'npm',
    title: 'Typosquat of cross-env stealing environment variables',
    category: 'typosquat',
    severity: 'high',
    score: 78,
    status: 'mitigated',
    affectsVersion: '*',
    discoveredAt: '11:15:33',
    sources: ['registry', 'github-advisory'],
    sourceUrls: ['https://github.com/advisories/GHSA-xxxx-0004'],
    description: 'Fake package "crossenv" mimics the popular "cross-env" package. The postinstall script exfiltrates process.env to an attacker-controlled server. Bright Data SERP API surfaced registry search results showing 39 similar typosquat variants.',
    evidence: [
      'Package name is 1-char typosquat of cross-env (39M downloads/week)',
      'postinstall sends process.env to hxxp://attacker.example/env',
      'SERP API scan found 39 additional typosquat variants',
      'Package removed from registry after report',
    ],
    brightDataSource: 'SERP API',
  },
  {
    id: 'thr_005',
    package: 'xz-utils',
    ecosystem: 'system',
    title: 'Multi-year social engineering backdoor in xz/liblzma (CVE-2024-3094)',
    category: 'backdoor',
    severity: 'critical',
    score: 99,
    status: 'active',
    affectsVersion: '5.6.0, 5.6.1',
    discoveredAt: '09:44:11',
    sources: ['nvd', 'github-advisory', 'social', 'blog', 'darkweb'],
    sourceUrls: ['https://nvd.nist.gov/vuln/detail/CVE-2024-3094'],
    cveId: 'CVE-2024-3094',
    description: 'Sophisticated multi-year supply chain attack where a new maintainer inserted a backdoor into xz-utils affecting SSH authentication via liblzma. Bright Data MCP Server orchestrated a full multi-source investigation across NVD, GitHub, mailing lists, and security blogs.',
    evidence: [
      'Backdoor in build system: malicious test files decode to binary blob',
      'Binary blob hooks into RSA_public_decrypt in sshd via liblzma',
      'Attacker cultivated trust as co-maintainer over 2 years',
      'MCP Server correlated 47 sources across GitHub, NVD, oss-security ML',
      'Affects major Linux distros: Fedora 40/41, Debian testing, Arch',
    ],
    brightDataSource: 'MCP Server + Scraping Browser',
  },
  {
    id: 'thr_006',
    package: 'polyfill.io',
    ecosystem: 'cdn',
    title: 'CDN domain takeover injecting malware via polyfill.io',
    category: 'malware',
    severity: 'critical',
    score: 91,
    status: 'active',
    affectsVersion: 'cdn/*',
    discoveredAt: '08:22:56',
    sources: ['blog', 'social', 'registry'],
    sourceUrls: ['https://sansec.io/research/polyfill-supply-chain-attack'],
    description: 'The polyfill.io domain was acquired by a new entity and began serving malicious JavaScript to ~100,000 websites. Bright Data Scraping Browser executed the injected JS in a sandboxed browser to capture the redirect chains and payloads.',
    evidence: [
      'Domain ownership transferred to entity linked to China-based CDN',
      'Conditional payload: only triggers on mobile devices, avoids bots',
      'Redirect chain leads to sports betting and adult sites',
      'Scraping Browser captured full redirect waterfall and deobfuscated JS',
      'SERP API found 100K+ sites still loading polyfill.io scripts',
    ],
    brightDataSource: 'Scraping Browser + SERP API',
  },
  {
    id: 'thr_007',
    package: 'lodash',
    ecosystem: 'npm',
    title: 'Prototype pollution in lodash.merge (CVE-2025-44099)',
    category: 'cve',
    severity: 'medium',
    score: 52,
    status: 'mitigated',
    affectsVersion: '<4.17.22',
    discoveredAt: '07:10:03',
    sources: ['nvd', 'github-advisory'],
    sourceUrls: ['https://nvd.nist.gov/vuln/detail/CVE-2025-44099'],
    cveId: 'CVE-2025-44099',
    description: 'Prototype pollution vulnerability in lodash.merge allows attackers to modify Object.prototype properties. Patched in 4.17.22. Web Scraper API structured the NVD advisory into actionable JSON.',
    evidence: [
      'Crafted __proto__ payload can override Object properties',
      'Patched in lodash 4.17.22 — upgrade recommended',
      'Limited exploitability: requires direct user input to merge()',
      'NVD CVSS: 6.5 (Medium)',
    ],
    brightDataSource: 'Web Scraper API',
  },
  {
    id: 'thr_008',
    package: 'requests',
    ecosystem: 'PyPI',
    title: 'Dependency confusion: internal "requests-auth" leaked to PyPI',
    category: 'dependency-confusion',
    severity: 'high',
    score: 74,
    status: 'investigating',
    affectsVersion: '*',
    discoveredAt: '06:55:21',
    sources: ['registry', 'blog', 'social'],
    sourceUrls: ['https://medium.com/@researcher/dep-confusion-requests'],
    description: 'An attacker published "requests-auth" to PyPI with a higher version number than an internal company package, causing pip to install the malicious public version. Bright Data Web Unlocker scraped the PyPI HTML pages to extract metadata and setup.py contents.',
    evidence: [
      'Public package version (99.0.0) higher than internal (1.2.3)',
      'setup.py contains postinstall reverse shell payload',
      'Targets companies using internal package names matching public PyPI',
      'Web Unlocker bypassed PyPI rate-limiting to bulk-scan 200+ packages',
    ],
    brightDataSource: 'Web Unlocker',
  },
]

/* ───── Protected stacks ───── */

export const protectedStacks: ProtectedStack[] = [
  {
    name: 'frontend-app',
    framework: 'React 19 + Vite',
    deps: 847,
    vulnerabilities: 3,
    lastScan: '2 min ago',
    status: 'at-risk',
    Icon: Globe2,
  },
  {
    name: 'api-service',
    framework: 'Node.js + Express',
    deps: 1203,
    vulnerabilities: 1,
    lastScan: '8 min ago',
    status: 'protected',
    Icon: TerminalSquare,
  },
  {
    name: 'ml-pipeline',
    framework: 'Python 3.12 + PyTorch',
    deps: 562,
    vulnerabilities: 2,
    lastScan: 'scanning…',
    status: 'scanning',
    Icon: Bot,
  },
]

/* ───── Research / Why this wins ───── */

export const researchSignals = [
  {
    title: 'Bright Data SERP API',
    detail:
      'Real-time Google search for package names + supply chain keywords surfaces security blogs, GitHub discussions, and exploit chatter hours before structured databases index them.',
    source: 'Early warning — live web',
    Icon: Search,
  },
  {
    title: 'Bright Data Web Unlocker',
    detail:
      'Bypasses CAPTCHAs and bot protection on security blogs, advisory pages, and paste sites to extract evidence snippets that static API calls cannot reach.',
    source: 'Bot-protected source access',
    Icon: Unplug,
  },
  {
    title: 'AI/ML API Agent Layer',
    detail:
      'Generates executive threat briefs from structured CVEs + live web evidence. Classifies severity, recommends remediation, cites every source by URL.',
    source: 'Partner challenge: AI/ML API',
    Icon: Sparkles,
  },
  {
    title: 'Supply Chain Wedge',
    detail:
      'Unlike generic CVE scanners, DepthGuard correlates npm/PyPI advisories with live web signals — detecting typosquats, hijacks, and zero-day chatter that OSV alone misses.',
    source: 'Track 3 — Security & Compliance',
    Icon: Radar,
  },
]

/* ───── Audit timeline ───── */

export const timeline = [
  {
    time: '14:02:19',
    title: 'CRITICAL: colors.js sabotage detected',
    detail: 'Scraping Browser captured malicious commit diff on npm registry. Auto-blocked in all stacks.',
    Icon: ShieldAlert,
  },
  {
    time: '13:48:10',
    title: 'Investigating event-stream backdoor',
    detail: 'Web Unlocker extracted encrypted payload from paste site. AI/ML API deobfuscating.',
    Icon: Eye,
  },
  {
    time: '12:31:45',
    title: 'ua-parser-js hijack confirmed',
    detail: 'Web Scraper API cross-referenced 12 security blogs. Remediation advisory generated.',
    Icon: FileWarning,
  },
  {
    time: '09:44:15',
    title: 'xz-utils backdoor: 47 sources correlated',
    detail: 'MCP Server completed full investigation across NVD, GitHub, mailing lists.',
    Icon: ShieldCheck,
  },
  {
    time: '08:22:58',
    title: 'polyfill.io CDN takeover detected',
    detail: 'Scraping Browser executed injected JS in sandbox, captured redirect chain.',
    Icon: CircleAlert,
  },
]

/* ───── Metrics ───── */

export const operatingMetrics = [
  { label: 'Sources scraped', value: '4,218', delta: '+24%' },
  { label: 'Threats detected', value: '47', delta: '+18%' },
  { label: 'Avg detection', value: '11 min', delta: '-34%' },
  { label: 'Stacks protected', value: '3', delta: '+0%' },
]

/* ───── Nav ───── */

export const navItems = [
  { label: 'Threat Feed', Icon: Activity },
  { label: 'Web Intel', Icon: Globe2 },
  { label: 'Stacks', Icon: Layers },
  { label: 'Scanning', Icon: Radar },
  { label: 'Incidents', Icon: ShieldAlert },
  { label: 'Audit Log', Icon: FileClock },
  { label: 'Bright Data', Icon: Database },
]

/* ───── Hero primitives ───── */

export const primitives = [
  { label: 'SERP API', Icon: Search },
  { label: 'Web Unlocker', Icon: Unplug },
  { label: 'OSV.dev', Icon: Database },
  { label: 'AI/ML API', Icon: Sparkles },
]

/* ───── Market notes ───── */

export const marketNotes = [
  'DepthGuard is an autonomous agent: OSV/GitHub for structured CVEs, Bright Data SERP + Web Unlocker for live web intelligence OSV cannot reach.',
  'Early Warning layer detects exploit chatter, malware reports, and CVE mentions on the open web before full advisory sync.',
  'AI/ML API synthesizes multi-source evidence into executive threat briefs with cited sources for DevSecOps and CISO teams.',
]

/* ───── Bright Data products used ───── */

export const brightDataProducts = [
  {
    name: 'SERP API',
    description: 'Real-time Google search — 6 targeted queries per package scan',
    useCase: 'Surfaces supply chain attacks, CVE chatter, GitHub advisories, and security blog coverage before OSV sync',
    Icon: Search,
  },
  {
    name: 'Web Scraper API (multi-source)',
    description: 'Structured web intel via SERP site: filters (GitHub, NVD, BleepingComputer)',
    useCase: 'Extracts multi-source intelligence objects from live web without static API limits',
    Icon: Database,
  },
  {
    name: 'Web Unlocker',
    description: 'Optional — bypass bot protection when zone available',
    useCase: 'Deep-scrapes npm registry and security blogs for evidence snippets',
    Icon: Unplug,
  },
]
