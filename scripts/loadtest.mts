/**
 * What happens to this platform when the conference actually fills up.
 *
 * Seeds attendees in stages and, at each stage, times the operations whose
 * cost grows with the number of people: the admin directory, the search box,
 * the CSV export, a broadcast to a whole category, and — as a control — one
 * attendee's own dashboard, which should not care how many others exist.
 *
 * Everything it writes carries @loadtest.invalid or the [LT] marker, so the
 * cleanup at the end is exact and can never reach a real account.
 *
 * Run with:  npx tsx scripts/loadtest.mts 1000,10000,50000
 *            npx tsx scripts/loadtest.mts clean     (just remove the rows)
 */
import { readFileSync } from 'node:fs';

/**
 * Where this is allowed to run.
 *
 * It writes tens of thousands of rows, so it refuses to touch the production
 * database at all. Put a throwaway database — a Neon branch, or a local
 * Postgres — in .env.loadtest as DATABASE_URL, and it runs against that.
 *
 * The endpoints are compared rather than trusted: pointing this at production
 * by copying the wrong string is the one mistake that would actually cost
 * something, so it is checked rather than documented.
 */
function readEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.*?)"?\s*$/);
      if (m) out[m[1]] = m[2];
    }
  } catch {
    /* absent is handled by the caller */
  }
  return out;
}

/** The host and database, which is what identifies a Neon endpoint. */
function endpointOf(url: string): string {
  try {
    const u = new URL(url);
    // Neon's pooled and direct endpoints differ only by a "-pooler" suffix;
    // they are the same database, so normalise it away before comparing.
    return `${u.hostname.replace('-pooler', '')}${u.pathname}`;
  } catch {
    return '';
  }
}

const target = readEnvFile('.env.loadtest').DATABASE_URL;
const production = readEnvFile('.env.local').DATABASE_URL;

if (!target) {
  console.error(
    'No .env.loadtest found.\n\n' +
      'This script writes tens of thousands of rows, so it will not run against\n' +
      'the production database. Create a Neon branch (or start a local Postgres),\n' +
      'then put its connection string in .env.loadtest:\n\n' +
      '  DATABASE_URL="postgresql://...branch-endpoint.../neondb?sslmode=require"\n',
  );
  process.exit(1);
}

if (production && endpointOf(target) === endpointOf(production)) {
  console.error(
    'Refusing to run: .env.loadtest points at the SAME endpoint as .env.local.\n' +
      `  ${endpointOf(target)}\n\n` +
      'That is the production database. Use a branch with its own endpoint.\n',
  );
  process.exit(1);
}

// Set before the client is imported — lib/db/client reads this as it loads.
process.env.DATABASE_URL = target;
process.env.DATABASE_URL_UNPOOLED = readEnvFile('.env.loadtest').DATABASE_URL_UNPOOLED ?? target;
process.env.DIRECT_URL = process.env.DATABASE_URL_UNPOOLED;

console.log(`target database: ${endpointOf(target)}`);

const { prisma } = await import('../lib/db/client');
const { parseUserFilters, userWhere, userOrderBy } = await import('../lib/admin-users');
const { inPages } = await import('../lib/export-pages');
const { deliverAnnouncement } = await import('../app/admin/(panel)/announcements/send');

const DOMAIN = '@loadtest.invalid';
const MARK = '[LT]';

/**
 * One precomputed cost-12 hash, reused for every seeded account. Hashing
 * 100,000 passwords would take hours and would be measuring bcrypt rather than
 * anything this platform does. Nothing hashes to it, so none of these accounts
 * can be signed into.
 */
const HASH = '$2b$12$OhgroOi4ucfQy.WB2AdZfeD/VO3xaVZ0RXaIJS/80gXHuCTvBn9VK';

const CATS = ['visitor', 'participant', 'volunteer'];
const COUNTRIES = ['اليمن', 'تركيا', 'مصر', 'السعودية', 'ماليزيا', 'الأردن'];

async function ms<T>(fn: () => Promise<T>): Promise<[number, T]> {
  const t = process.hrtime.bigint();
  const out = await fn();
  return [Number(process.hrtime.bigint() - t) / 1e6, out];
}
const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(2)} s` : `${Math.round(n)} ms`);
const pad = (label: string) => label.padEnd(32);

async function cleanup(): Promise<void> {
  // Notifications, submissions and saved sessions hang off User by a cascading
  // relation, so deleting the accounts takes them too.
  const users = await prisma.user.deleteMany({ where: { email: { endsWith: DOMAIN } } });
  const notes = await prisma.notification.deleteMany({ where: { title: { startsWith: MARK } } });
  const anns = await prisma.announcement.deleteMany({ where: { title: { startsWith: MARK } } });
  console.log(
    `cleanup: ${users.count.toLocaleString()} accounts, ` +
      `${notes.count.toLocaleString()} stray notifications, ${anns.count} announcements`,
  );
}

async function seedTo(target: number): Promise<void> {
  const have = await prisma.user.count({ where: { email: { endsWith: DOMAIN } } });
  if (have >= target) return;

  const BATCH = 2000;
  const t0 = Date.now();
  let made = 0;

  for (let i = have; i < target; i += BATCH) {
    const rows = [];
    for (let j = i; j < Math.min(i + BATCH, target); j++) {
      rows.push({
        email: `lt${j}${DOMAIN}`,
        passwordHash: HASH,
        name: `${MARK} مشارك رقم ${j}`,
        role: 'ATTENDEE' as const,
        category: CATS[j % CATS.length],
        country: COUNTRIES[j % COUNTRIES.length],
        organization: `${MARK} جهة ${j % 500}`,
        phone: `+9677${String(j).padStart(8, '0')}`,
        confirmationCode: `LT${String(j).padStart(9, '0')}`,
      });
    }
    await prisma.user.createMany({ data: rows, skipDuplicates: true });
    made += rows.length;
  }

  const secs = (Date.now() - t0) / 1000;
  console.log(`  seeded ${made.toLocaleString()} accounts in ${secs.toFixed(1)}s (${Math.round(made / secs).toLocaleString()}/sec)`);
}

async function measure(): Promise<void> {
  const total = await prisma.user.count();
  const [{ size }] = await prisma.$queryRawUnsafe<{ size: string }[]>(
    `SELECT pg_size_pretty(pg_database_size(current_database())) AS size`,
  );
  console.log(`\n===== ${total.toLocaleString()} accounts  ·  branch is ${size} of its 512 MB =====`);

  const f = parseUserFilters({});

  // A warm-up. Neon's compute suspends when idle, so the first query after a
  // pause pays for a cold start — which would otherwise land on whichever
  // measurement happened to run first and look like a finding.
  await prisma.user.findFirst({ select: { id: true } });

  // The admin directory, page 1 — paginated, so this should stay flat.
  const [tList] = await ms(() =>
    Promise.all([
      prisma.user.findMany({
        where: userWhere(f), orderBy: userOrderBy(f.sort), take: 25,
        select: { id: true, name: true, email: true, category: true, role: true, createdAt: true },
      }),
      prisma.user.count({ where: userWhere(f) }),
    ]),
  );
  console.log(`  ${pad('admin directory, page 1')}${fmt(tList)}`);

  // The last page. OFFSET has to count its way there, so this is where
  // pagination stops being free.
  const [tDeep] = await ms(() =>
    prisma.user.findMany({
      where: userWhere(f), orderBy: userOrderBy(f.sort),
      skip: Math.max(0, total - 50), take: 25, select: { id: true, name: true },
    }),
  );
  console.log(`  ${pad('admin directory, last page')}${fmt(tDeep)}`);

  // Search by name: a substring match, which no B-tree index can serve.
  const fq = parseUserFilters({ q: 'مشارك رقم 9' });
  const [tSearch, rSearch] = await ms(() =>
    prisma.user.findMany({ where: userWhere(fq), take: 25, select: { id: true } }),
  );
  console.log(`  ${pad('search by name')}${fmt(tSearch)}  (${rSearch.length} shown)`);

  // The CSV export. No `take` anywhere in it — it loads every matching row,
  // with three correlated counts per row, inside one serverless invocation.
  const [tCsv, rCsv] = await ms(() =>
    prisma.user.findMany({
      where: userWhere(f), orderBy: userOrderBy(f.sort),
      select: {
        name: true, email: true, phone: true, country: true, organization: true,
        role: true, category: true, track: true, confirmationCode: true, createdAt: true,
        _count: { select: { submissions: true, savedSessions: true, attendance: true } },
      },
    }),
  );
  const heap = Math.round(process.memoryUsage().heapUsed / 1048576);
  console.log(`  ${pad('CSV export, all at once')}${fmt(tCsv)}  (${rCsv.length.toLocaleString()} rows, heap ${heap} MB)`);

  // The same export the streaming route now does: one page held at a time.
  // Peak heap is what matters, so it is sampled as it goes rather than read
  // once at the end, when the last page may already have been collected.
  if (global.gc) global.gc();
  const baseline = process.memoryUsage().heapUsed;
  let peak = 0;
  let streamed = 0;
  const [tStream] = await ms(async () => {
    const pages = inPages((after, take) =>
      prisma.user.findMany({
        where: userWhere(f),
        orderBy: [...userOrderBy(f.sort), { id: 'asc' }],
        ...(after ? { cursor: { id: after }, skip: 1 } : {}),
        take,
        select: {
          id: true,
          name: true, email: true, phone: true, country: true, organization: true,
          role: true, category: true, track: true, confirmationCode: true, createdAt: true,
          _count: { select: { submissions: true, savedSessions: true, attendance: true } },
        },
      }),
    );
    for await (const page of pages) {
      streamed += page.length;
      // Format the page the way the route does, so the comparison is fair.
      page.map((u) => [u.name, u.email, u.phone, u.confirmationCode, u._count.attendance]);
      peak = Math.max(peak, process.memoryUsage().heapUsed - baseline);
    }
  });
  console.log(`  ${pad('CSV export, streamed')}${fmt(tStream)}  (${streamed.toLocaleString()} rows, peak +${Math.round(peak / 1048576)} MB)`);

  // The one sort no index can serve: Prisma turns it into a join and a group
  // over the whole table to rank by a related count.
  const fa = parseUserFilters({ sort: 'active' });
  const [tActive] = await ms(() =>
    prisma.user.findMany({
      where: userWhere(fa), orderBy: userOrderBy(fa.sort), take: 25,
      select: { id: true, name: true },
    }),
  );
  console.log(`  ${pad('admin directory, sort=active')}${fmt(tActive)}`);

  // The control: one attendee's own dashboard. Every query is by userId, so
  // the size of the conference should not show up here at all.
  const one = await prisma.user.findFirst({
    where: { email: { endsWith: DOMAIN } }, select: { id: true },
  });
  if (one) {
    const [tDash] = await ms(() =>
      Promise.all([
        prisma.notification.findMany({ where: { userId: one.id }, orderBy: { createdAt: 'desc' }, take: 20 }),
        prisma.notification.count({ where: { userId: one.id, read: false } }),
        prisma.savedSession.findMany({ where: { userId: one.id } }),
        prisma.projectSubmission.findMany({ where: { userId: one.id } }),
      ]),
    );
    console.log(`  ${pad("one attendee's dashboard")}${fmt(tDash)}`);
  }

  // The admin overview counters, which run on every panel load.
  const [tStats] = await ms(() =>
    Promise.all([
      prisma.user.count({ where: { role: 'ATTENDEE' } }),
      prisma.registration.count(),
      prisma.projectSubmission.count({ where: { status: 'PENDING' } }),
      prisma.user.groupBy({ by: ['category'], _count: true }),
    ]),
  );
  console.log(`  ${pad('admin overview counters')}${fmt(tStats)}`);
}

async function broadcast(): Promise<void> {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
  if (!admin) return;

  const title = `${MARK} إعلان اختبار الحِمل`;
  const [t, res] = await ms(() =>
    deliverAnnouncement(admin.id, {
      title, body: 'اختبار حِمل — يُحذف تلقائياً.', link: '/program', audience: 'visitor',
    }),
  );
  const sent = 'sent' in res ? res.sent : res.error;
  console.log(`  ${pad('broadcast to one category')}${fmt(t)}  (${typeof sent === 'number' ? sent.toLocaleString() : sent} recipients)`);

  const removed = await prisma.notification.deleteMany({ where: { title } });
  await prisma.announcement.deleteMany({ where: { title } });
  console.log(`  ${pad('  ...notifications removed')}${removed.count.toLocaleString()}`);
}

// --- run ---------------------------------------------------------------------

const arg = process.argv[2] ?? '1000,10000,50000';

if (arg === 'clean') {
  await cleanup();
} else if (arg === 'seed') {
  // Seed and stop, leaving the rows in place for the concurrency test to read.
  // `clean` removes them afterwards.
  const n = Number(process.argv[3] ?? 10000);
  console.log(`seeding ${n.toLocaleString()} and leaving them in place`);
  await seedTo(n);
  console.log('accounts now:', (await prisma.user.count()).toLocaleString());
} else {
  console.log('accounts before:', (await prisma.user.count()).toLocaleString());
  try {
    for (const n of arg.split(',').map(Number)) {
      console.log(`\n--- seeding to ${n.toLocaleString()} ---`);
      await seedTo(n);
      await measure();
      await broadcast();
    }
  } finally {
    console.log('');
    await cleanup();
    console.log('accounts after :', (await prisma.user.count()).toLocaleString());
  }
}

await prisma.$disconnect();
process.exit(0);
