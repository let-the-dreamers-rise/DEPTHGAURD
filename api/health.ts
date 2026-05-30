export const config = {
  maxDuration: 10,
}

export default function handler(_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) {
  res.status(200).json({
    ok: true,
    service: 'DepthGuard Agent API',
    brightData: Boolean(process.env.BRIGHTDATA_API_KEY && (process.env.BRIGHTDATA_SERP_ZONE || process.env.BRIGHTDATA_ZONE)),
    brightDataMode: process.env.BRIGHTDATA_UNLOCKER_ZONE ? 'serp+unlocker' : 'serp-only',
    unlocker: Boolean(process.env.BRIGHTDATA_UNLOCKER_ZONE),
    aiml: Boolean(process.env.AIML_API_KEY),
    slack: Boolean(process.env.SLACK_WEBHOOK_URL),
    track: 'Security & Compliance — Web Data UNLOCKED',
  })
}
