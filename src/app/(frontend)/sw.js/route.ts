import { buildServiceWorker } from '@/lib/pwa/serviceWorker'

export const dynamic = 'force-dynamic'

const startedAt = Date.now().toString(36)

/** Deployment identity, so each deploy ships a new worker and drops stale page caches. */
function version(): string {
  return (
    process.env.VERCEL_DEPLOYMENT_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
    `local-${startedAt}`
  )
}

export function GET() {
  return new Response(buildServiceWorker(version()), {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Service-Worker-Allowed': '/',
    },
  })
}
