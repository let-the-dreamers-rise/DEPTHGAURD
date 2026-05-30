import serverless from 'serverless-http'
import app from '../server/index.ts'

export const config = {
  maxDuration: 300,
}

const handler = serverless(app)

export default async function vercelHandler(req: unknown, res: unknown) {
  try {
    return await handler(req as Parameters<typeof handler>[0], res as Parameters<typeof handler>[1])
  } catch (err) {
    console.error('[DepthGuard] serverless handler error:', err)
    const response = res as { status?: (n: number) => { json: (b: unknown) => void } }
    if (typeof response.status === 'function') {
      response.status(500).json({ error: err instanceof Error ? err.message : String(err) })
      return
    }
    throw err
  }
}
