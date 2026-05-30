import { brightDataConfigured, unlockerConfigured } from '../server/brightdata.ts'

export const config = {
  maxDuration: 10,
}

export default function handler(_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) {
  res.status(200).json({
    ok: true,
    service: 'DepthGuard Agent API',
    brightData: brightDataConfigured(),
    brightDataMode: unlockerConfigured() ? 'serp+unlocker' : 'serp-only',
    unlocker: unlockerConfigured(),
    aiml: Boolean(process.env.AIML_API_KEY),
    slack: Boolean(process.env.SLACK_WEBHOOK_URL),
    track: 'Security & Compliance — Web Data UNLOCKED',
  })
}
