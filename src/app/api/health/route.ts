import { prisma } from '@/lib/db/prisma';

// Liveness + shallow readiness probe (production-readiness-report.md M2). Public
// and unauthenticated so load balancers / uptime monitors can hit it; it reveals
// no data — only whether the process is up and the database answers a trivial
// query. Always dynamic so it reflects live state, never a cached 200.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: 'ok', db: 'up', time: new Date().toISOString() });
  } catch {
    // Don't leak the error detail; 503 tells the orchestrator to route away.
    return Response.json(
      { status: 'degraded', db: 'down', time: new Date().toISOString() },
      { status: 503 },
    );
  }
}
