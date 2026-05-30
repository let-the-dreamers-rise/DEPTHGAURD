# DepthGuard

**Autonomous supply chain threat agent** for the [Web Data UNLOCKED Hackathon](https://lablab.ai) — Track 3: Security & Compliance.

DepthGuard combines structured CVE databases (OSV + GitHub) with **Bright Data live web intelligence** (SERP API + Web Unlocker) and **AI/ML API** executive briefs to detect supply chain threats before they fully sync to advisory databases.

## What's new (continued build)

- **Live SSE pipeline** — scan steps update in real time during demo (`/api/agent/scan/stream`)
- **Web Intel tab** — every Bright Data URL with SERP vs Unlocker badges
- **AI brief banner** — latest executive brief at top of dashboard
- **npm registry unlock** — Web Unlocker scrapes npm.com package pages
- **Dockerfile** — one-command deploy anywhere

## Demo packages (best for judges)

| Package | Why |
|---------|-----|
| `event-stream` | Famous supply chain attack (flatmap-stream) |
| `ua-parser-js` | Maintainer hijack + cryptominer |
| `lodash` | Many CVEs — shows structured + web correlation |


1. Launch dashboard → auto-scans `event-stream`, `lodash`, `jsonwebtoken`
2. Go to **Scanning** → scan `event-stream` or `ua-parser-js`
3. Watch 6-stage pipeline: OSV → GitHub → **Bright Data SERP** → **Web Unlocker** → **AI/ML API**
4. Show **Executive Threat Brief** + **Bright Data web signals** with live URLs
5. Show **EARLY** badges on web-sourced threats in Threat Feed

## Tech stack

| Layer | Technology |
|-------|------------|
| Live web data | Bright Data SERP API, Web Unlocker |
| Intelligence | AI/ML API (gpt-4o-mini) |
| Structured CVEs | OSV.dev, GitHub Advisory DB |
| Frontend | React 19 + Vite |
| Backend agent | Express + TypeScript |

## Quick start

```bash
npm install
cp .env.example .env
# Add your Bright Data API key + zone names (see below)
npm run dev
```

Open http://localhost:5173 — API runs on http://localhost:8787

## Environment variables

Redeem hackathon credits at [brightdata.com](https://brightdata.com) → Billing → promo code **`unlocked`**

```env
BRIGHTDATA_API_KEY=your_api_key
BRIGHTDATA_SERP_ZONE=your_serp_zone_name
BRIGHTDATA_UNLOCKER_ZONE=your_unlocker_zone   # optional, falls back to SERP zone

AIML_API_KEY=your_aiml_key   # optional, from lablab partner credits
AIML_MODEL=gpt-4o-mini
PORT=8787
```

Create zones in Bright Data Control Panel:
1. **SERP API** zone → copy zone name + API key
2. **Web Unlocker** zone (recommended) → copy zone name

## Production deploy (Render / Railway)

```bash
npm run build
npm start
```

Single process serves API + static frontend on `PORT`.

## Hackathon submission

- **Track:** Security & Compliance (Track 3)
- **Bright Data products:** SERP API, Web Unlocker
- **Partner:** AI/ML API
- **Repo:** public GitHub
- **Demo URL:** deploy and paste in lablab submission

## Architecture

```
package.json / package name
        ↓
┌───────────────────────────────────────┐
│  DepthGuard Agent (Express)           │
│  1. OSV.dev + GitHub Advisories       │
│  2. Bright Data SERP (live search)    │
│  3. Bright Data Web Unlocker (scrape) │
│  4. AI/ML API (executive brief)       │
│  5. Correlate → early warning threats │
└───────────────────────────────────────┘
        ↓
React dashboard: threats, web signals, agent brief
```

## License

MIT — Web Data UNLOCKED Hackathon submission
