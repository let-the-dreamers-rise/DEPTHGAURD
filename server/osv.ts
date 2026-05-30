/** Server-side OSV + GitHub advisory queries (same logic as client, unified pipeline) */

export interface OsvVulnerability {
  id: string
  summary: string
  details: string
  severity: { type: string; score: string }[]
  affected: {
    package: { ecosystem: string; name: string }
    ranges: { type: string; events: { introduced?: string; fixed?: string }[] }[]
    versions?: string[]
  }[]
  references: { type: string; url: string }[]
  published: string
  modified: string
  aliases: string[]
}

export interface LiveThreat {
  id: string
  package: string
  ecosystem: string
  title: string
  cveId: string | null
  severity: 'critical' | 'high' | 'medium' | 'low'
  score: number
  description: string
  affectsVersions: string
  fixedIn: string | null
  references: string[]
  publishedDate: string
  source: string
  brightDataSource?: string
  earlyWarning?: boolean
}

const OSV_API = 'https://api.osv.dev/v1'

function cvssToScore(severity: OsvVulnerability['severity']): number {
  if (!severity?.length) return 50
  const parsed = parseFloat(severity[0]?.score ?? '')
  return !isNaN(parsed) ? Math.round(parsed * 10) : 50
}

function osvSeverityToLevel(vuln: OsvVulnerability): LiveThreat['severity'] {
  const score = cvssToScore(vuln.severity)
  if (score >= 90) return 'critical'
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

export function osvToLiveThreat(vuln: OsvVulnerability): LiveThreat {
  const affected = vuln.affected?.[0]
  const cveId = vuln.aliases?.find((a) => a.startsWith('CVE-')) ?? null
  const fixedEvent = affected?.ranges?.[0]?.events?.find((e) => e.fixed)
  const introEvent = affected?.ranges?.[0]?.events?.find((e) => e.introduced)

  return {
    id: vuln.id,
    package: affected?.package?.name ?? 'unknown',
    ecosystem: affected?.package?.ecosystem ?? 'npm',
    title: vuln.summary || vuln.id,
    cveId,
    severity: osvSeverityToLevel(vuln),
    score: cvssToScore(vuln.severity),
    description: vuln.details?.slice(0, 500) || vuln.summary || '',
    affectsVersions: introEvent?.introduced ? `>=${introEvent.introduced}` : affected?.versions?.slice(0, 3).join(', ') ?? 'unknown',
    fixedIn: fixedEvent?.fixed ?? null,
    references: vuln.references?.map((r) => r.url).slice(0, 5) ?? [],
    publishedDate: vuln.published ?? '',
    source: 'OSV.dev (Google)',
  }
}

export async function queryOsv(packageName: string, ecosystem: string): Promise<OsvVulnerability[]> {
  const res = await fetch(`${OSV_API}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ package: { name: packageName, ecosystem } }),
  })
  if (!res.ok) throw new Error(`OSV API error: ${res.status}`)
  const data = (await res.json()) as { vulns?: OsvVulnerability[] }
  return data.vulns ?? []
}

interface GhAdvisory {
  ghsa_id: string
  cve_id: string | null
  summary: string
  description: string
  severity: string
  references: string[]
  published_at: string
  vulnerabilities: {
    package: { ecosystem: string; name: string }
    vulnerable_version_range: string
    first_patched_version: { identifier: string } | null
  }[]
}

export async function queryGitHubAdvisories(packageName: string, ecosystem: string): Promise<LiveThreat[]> {
  try {
    const params = new URLSearchParams({ type: 'reviewed', ecosystem, per_page: '20' })
    const res = await fetch(`https://api.github.com/advisories?${params}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'DepthGuard-Hackathon' },
    })
    if (!res.ok) return []
    const data = (await res.json()) as GhAdvisory[]
    const kw = packageName.toLowerCase()
    return data
      .filter(
        (a) =>
          a.summary?.toLowerCase().includes(kw) ||
          a.vulnerabilities?.some((v) => v.package.name.toLowerCase().includes(kw))
      )
      .map((adv) => {
        const vuln = adv.vulnerabilities?.[0]
        return {
          id: adv.ghsa_id,
          package: vuln?.package?.name ?? packageName,
          ecosystem: vuln?.package?.ecosystem ?? ecosystem,
          title: adv.summary,
          cveId: adv.cve_id,
          severity: (adv.severity === 'critical' ? 'critical' : adv.severity === 'high' ? 'high' : adv.severity === 'moderate' ? 'medium' : 'low') as LiveThreat['severity'],
          score: adv.severity === 'critical' ? 95 : adv.severity === 'high' ? 75 : adv.severity === 'moderate' ? 50 : 25,
          description: adv.description?.slice(0, 500) ?? '',
          affectsVersions: vuln?.vulnerable_version_range ?? 'unknown',
          fixedIn: vuln?.first_patched_version?.identifier ?? null,
          references: adv.references?.slice(0, 5) ?? [],
          publishedDate: adv.published_at ?? '',
          source: 'GitHub Advisory DB',
        }
      })
  } catch {
    return []
  }
}

/** Web-only early warning when SERP finds exploit chatter but OSV has no CVE yet */
export function webSignalsToThreats(
  packageName: string,
  ecosystem: string,
  evidence: { title: string; url: string; snippet: string; extractedText?: string }[],
  existingCveIds: Set<string>
): LiveThreat[] {
  const threats: LiveThreat[] = []
  const cveRe = /CVE-\d{4}-\d{4,7}/gi

  for (const ev of evidence) {
    const text = `${ev.title} ${ev.snippet} ${ev.extractedText ?? ''}`
    const matches = text.match(cveRe) ?? []
    for (const cve of matches) {
      const id = cve.toUpperCase()
      if (existingCveIds.has(id)) continue
      existingCveIds.add(id)
      threats.push({
        id: `web-${id}`,
        package: packageName,
        ecosystem,
        title: `Early web signal: ${cve} mentioned before structured advisory sync`,
        cveId: id,
        severity: 'high',
        score: 72,
        description: `Bright Data SERP/Web Unlocker found ${cve} in live web sources: "${ev.title}". This may indicate emerging intelligence before full OSV indexing.`,
        affectsVersions: 'Investigate',
        fixedIn: null,
        references: [ev.url],
        publishedDate: new Date().toISOString(),
        source: 'Bright Data Live Web',
        brightDataSource: 'SERP API + Web Unlocker',
        earlyWarning: true,
      })
    }

    if (/malware|compromised|backdoor|supply chain|typosquat|hijack/i.test(text) && matches.length === 0) {
      const sigId = `web-signal-${Buffer.from(ev.url).toString('base64url').slice(0, 12)}`
      if (threats.some((t) => t.id === sigId)) continue
      threats.push({
        id: sigId,
        package: packageName,
        ecosystem,
        title: ev.title.slice(0, 120),
        cveId: null,
        severity: 'medium',
        score: 58,
        description: ev.snippet || ev.extractedText?.slice(0, 300) || 'Live web signal detected via Bright Data.',
        affectsVersions: 'Unknown — verify',
        fixedIn: null,
        references: [ev.url],
        publishedDate: new Date().toISOString(),
        source: 'Bright Data Live Web',
        brightDataSource: 'SERP API + Web Unlocker',
        earlyWarning: true,
      })
    }
  }
  return threats.slice(0, 5)
}
