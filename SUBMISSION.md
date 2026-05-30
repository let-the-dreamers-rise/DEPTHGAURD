# lablab.ai Submission Copy — DepthGuard

## Project Title
**DepthGuard — Autonomous Supply Chain Threat Agent**

## Short Description
AI agent that combines OSV/GitHub CVE data with **Bright Data SERP API** (10 live Google queries per scan) to detect supply chain threats before they sync to advisory databases. AI/ML API generates cited executive briefs with Why-Now urgency scoring.

## Long Description

Every DevSecOps team relies on OSV, GitHub Advisories, and npm audit — but supply chain attacks surface on security blogs, forums, and paste sites **hours or days before** structured databases index them. The xz-utils backdoor, event-stream cryptominer, and ua-parser-js hijack all had live web chatter before official advisories.

**DepthGuard** is an autonomous 8-stage threat agent swarm:

1. **OSV.dev + GitHub Advisory DB** — structured CVE baseline
2. **Bright Data SERP API** — **10 live Google queries** per scan (supply chain, malware, CVE, typosquat, Snyk, post-mortems)
3. **AI/ML API (×3)** — executive brief, Why-Now urgency score (0–100), web signal classification
4. **Threat correlation** — merges CVEs + SERP early warnings + remediation plan
5. **Slack dispatch + SIEM JSON export** — enterprise-ready output
6. **React dashboard** — live SSE pipeline, Web Intel tab, package.json import, judge report

**Enterprise value:** CISO and DevSecOps teams get always-on supply chain intelligence that goes beyond what Dependabot/Snyk can see — because Bright Data SERP surfaces live web chatter that structured APIs cannot reach.

**Track:** Security & Compliance (Track 3)

**Bright Data products:** SERP API *(Web Unlocker optional — not required for hackathon)*

**Partner:** AI/ML API (intelligence layer)

## Technology Tags
- Bright Data SERP API
- AI/ML API
- React
- Express
- TypeScript
- OSV.dev
- Supply Chain Security
- SSE Live Pipeline

## 90-Second Demo Script (SERP-only — use this for video)

1. **0:00** — Landing: *"Find supply chain threats before CVEs sync"*
2. **0:08** — Click **Launch Agent Dashboard**
3. **0:12** — Click gold **Judge Demo** button (top-right) — instant `event-stream` scan
4. **0:20** — Pipeline animates: OSV Scout → GitHub Sentinel → **Bright Data SERP (10 queries)** → AI/ML ×3
5. **0:35** — Point at **Why-Now Score** (85+) and **Intelligence Gap** (OSV vs SERP)
6. **0:45** — Scroll to **Bright Data web signals** — click a live Google result URL (supply chain post-mortem)
7. **0:55** — **Executive Threat Brief** + **Remediation Plan**
8. **1:05** — Click **Judge Report (MD)** — downloadable markdown for judges
9. **1:15** — Threat Feed tab → EARLY WARNING badges
10. **1:25** — Web Intel tab → filter SERP API → show signal count

**One-liner for judges:** *"OSV tells you what's indexed. Bright Data SERP tells you what's happening right now."*

## Judging Criteria Mapping

| Criterion | DepthGuard proof |
|-----------|------------------|
| Application of Technology | Live Bright Data SERP (10 queries/scan) in agent pipeline; AI/ML API brief + Why-Now score |
| Presentation | 8-stage SSE pipeline, Judge Demo button, cited live URLs, markdown judge report |
| Business Value | $46B supply chain attack problem; DevSecOps/CISO buyer; Slack + SIEM export |
| Originality | Early warning layer: SERP web signals before CVE database sync |
