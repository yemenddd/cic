import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { buildAgendaIcs } from '@/lib/ics';

// Downloads the signed-in attendee's saved sessions as an .ics calendar file.
// The date/time assumptions behind the events (conference dates, Istanbul's
// fixed UTC+3 offset, the assumed 60-minute duration) are documented in
// lib/ics.ts — read them there before changing anything.
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  // proxy.ts gates /dashboard/*, but a handler that streams one user's data
  // must never depend on upstream protection having run.
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Scoped to the session user's id only — never to anything from the request.
  const saved = await prisma.savedSession.findMany({
    where: { userId },
    include: { session: true },
  });

  const sessions = saved
    .map((row) => row.session)
    // Same order the agenda page shows: day first, then the admin-set order.
    .sort((a, b) => a.day.localeCompare(b.day) || a.order - b.order);

  const ics = buildAgendaIcs(sessions);

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="cict-2026-agenda.ics"',
      'Cache-Control': 'no-store',
    },
  });
}
