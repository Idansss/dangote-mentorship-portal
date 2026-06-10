import { runScheduledNotifications } from '@/lib/notifications/cron';

// Machine-to-machine entry point for the scheduled notification emitters + daily
// digest (experience-layer.md §1.10). This route is OUTSIDE the auth middleware
// matcher (/api is excluded), so it authenticates with a shared CRON_SECRET
// instead of a session — invoke it from Vercel Cron or an on-prem scheduler
// (Task Scheduler/systemd timer) hitting this URL with
//   Authorization: Bearer <CRON_SECRET>
// The work is idempotent, so a missed or duplicated run is safe.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Fail closed: without a configured secret the job can't be authenticated.
    return new Response('Cron is not configured', { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await runScheduledNotifications();
  return Response.json({ ok: true, ...result });
}

// Vercel Cron issues GET; allow POST too for manual/other schedulers.
export async function GET(request: Request): Promise<Response> {
  return handle(request);
}
export async function POST(request: Request): Promise<Response> {
  return handle(request);
}
