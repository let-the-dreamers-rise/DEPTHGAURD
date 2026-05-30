/**
 * Bright Data — SERP API primary (Unlocker optional)
 * Hackathon: only ONE Bright Data product required. SERP alone qualifies.
 */

export interface SerpResult {
  title: string
  url: string
  snippet: string
  position: number
}

export interface WebEvidence {
  title: string
  url: string
  snippet: string
  source: 'serp' | 'unlocker'
  extractedText?: string
  serpQuery?: string
}

export interface SerpStats {
  queriesRun: number
  resultsFound: number
  sources: string[]
}

const BD_ENDPOINT = 'https://api.brightdata.com/request'

function cfg() {
  const apiKey = process.env.BRIGHTDATA_API_KEY
  const serpZone = process.env.BRIGHTDATA_SERP_ZONE || process.env.BRIGHTDATA_ZONE
  const unlockerZone = process.env.BRIGHTDATA_UNLOCKER_ZONE?.trim() || null
  return { apiKey, serpZone, unlockerZone }
}

export function brightDataConfigured(): boolean {
  const { apiKey, serpZone } = cfg()
  return Boolean(apiKey && serpZone)
}

export function unlockerConfigured(): boolean {
  const { unlockerZone } = cfg()
  return Boolean(unlockerZone)
}

export function brightDataMode(): 'serp-only' | 'serp+unlocker' {
  return unlockerConfigured() ? 'serp+unlocker' : 'serp-only'
}

async function brightDataRequest(zone: string, targetUrl: string): Promise<string> {
  const { apiKey } = cfg()
  if (!apiKey) throw new Error('BRIGHTDATA_API_KEY missing')

  const res = await fetch(BD_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ zone, url: targetUrl, format: 'raw' }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Bright Data ${res.status}: ${errText.slice(0, 200)}`)
  }
  return res.text()
}

function parseSerpJson(raw: string): SerpResult[] {
  try {
    const data = JSON.parse(raw)
    const organic = data.organic ?? data.results ?? data.organic_results ?? []
    if (!Array.isArray(organic)) return []

    return organic.slice(0, 10).map((item: Record<string, unknown>, i: number) => ({
      title: String(item.title ?? item.name ?? 'Untitled'),
      url: String(item.link ?? item.url ?? ''),
      snippet: String(item.snippet ?? item.description ?? ''),
      position: Number(item.rank ?? item.position ?? i + 1),
    })).filter((r) => r.url.startsWith('http'))
  } catch {
    return extractUrlsFromHtml(raw)
  }
}

function extractUrlsFromHtml(html: string): SerpResult[] {
  const results: SerpResult[] = []
  const linkRe = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([^<]{4,120})<\/a>/gi
  let m: RegExpExecArray | null
  while ((m = linkRe.exec(html)) && results.length < 8) {
    const url = m[1]
    if (url.includes('google.com') || url.includes('gstatic')) continue
    results.push({ title: m[2].trim(), url, snippet: '', position: results.length + 1 })
  }
  return results
}

export async function serpSearch(query: string): Promise<{ results: SerpResult[]; query: string }> {
  const { serpZone } = cfg()
  if (!serpZone) throw new Error('BRIGHTDATA_SERP_ZONE missing')

  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&brd_json=1&num=10`
  const raw = await brightDataRequest(serpZone, url)
  return { results: parseSerpJson(raw), query }
}

export async function unlockPage(pageUrl: string): Promise<string> {
  const { unlockerZone } = cfg()
  if (!unlockerZone) throw new Error('Web Unlocker not configured')

  const raw = await brightDataRequest(unlockerZone, pageUrl)
  return stripHtml(raw).slice(0, 4000)
}

export async function scrapeNpmRegistry(packageName: string): Promise<{ version?: string; description?: string } | null> {
  if (!unlockerConfigured()) return null
  try {
    const text = await unlockPage(`https://www.npmjs.com/package/${encodeURIComponent(packageName)}`)
    const version = text.match(/Current Tags[\s\S]*?(\d+\.\d+\.\d+)/i)?.[1]
    const description = text.match(/package-description[^>]*>([^<]+)/i)?.[1]
    return { version, description: description?.trim() }
  } catch {
    return null
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** SERP-only: 10 Google queries. Maximum Bright Data SERP coverage for hackathon demo */
export async function gatherWebEvidence(
  packageName: string,
  ecosystem: string
): Promise<{ evidence: WebEvidence[]; stats: SerpStats }> {
  const queries = [
    `"${packageName}" ${ecosystem} supply chain attack vulnerability`,
    `"${packageName}" malware compromised npm security`,
    `"${packageName}" CVE exploit advisory site:github.com`,
    `"${packageName}" hijack typosquat backdoor`,
    `"${packageName}" site:github.com/advisories OR site:nvd.nist.gov`,
    `"${packageName}" supply chain site:bleepingcomputer.com OR site:securityweek.com`,
    `"${packageName}" incident post-mortem site:medium.com OR site:dev.to`,
    `"${packageName}" flatmap-stream OR backdoor npm`,
    `"${packageName}" site:snyk.io OR site:security.snyk.io`,
    `"${packageName}" "supply chain" 2024 OR 2025`,
  ]

  const queryCount = unlockerConfigured() ? 6 : 10
  const seen = new Set<string>()
  const evidence: WebEvidence[] = []
  let queriesRun = 0

  for (const q of queries.slice(0, queryCount)) {
    try {
      queriesRun++
      const { results } = await serpSearch(q)
      for (const r of results) {
        if (seen.has(r.url)) continue
        seen.add(r.url)
        evidence.push({
          title: r.title,
          url: r.url,
          snippet: r.snippet,
          source: 'serp',
          serpQuery: q,
        })
      }
    } catch {
      /* continue */
    }
  }

  if (unlockerConfigured()) {
    const toScrape = evidence
      .filter((e) => /security|cve|github|blog|advisory|malware|supply|npm|pypi/i.test(e.url + e.title))
      .slice(0, 2)

    for (const item of toScrape) {
      try {
        const text = await unlockPage(item.url)
        item.extractedText = text.slice(0, 1500)
        item.source = 'unlocker'
      } catch {
        /* keep SERP snippet */
      }
    }
  }

  const stats: SerpStats = {
    queriesRun,
    resultsFound: evidence.length,
    sources: ['Google via Bright Data SERP API', 'GitHub', 'NVD', 'Security blogs', 'Snyk'],
  }

  return { evidence: evidence.slice(0, 30), stats }
}

export function productsUsed(): string[] {
  const used = ['SERP API']
  if (unlockerConfigured()) used.push('Web Unlocker')
  return used
}
