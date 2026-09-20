/**
 * Is `sort=active` actually expensive?
 *
 * It orders the directory by a count over a relation, which Prisma turns into
 * a join and a group over the whole table — no index can serve it. The staged
 * load test appeared to clear it at 380 ms, but that run had an empty
 * ProjectSubmission table, so the join had nothing to do and the number meant
 * nothing. This fills the relation first.
 *
 * Run with:  npx tsx scripts/loadtest-activesort.mts
 */
import { readFileSync } from 'node:fs';

function readEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.*?)"?\s*$/);
      if (m) out[m[1]] = m[2];
    }
  } catch {
    /* handled below */
  }
  return out;
}
const endpointOf = (url: string) => {
  try {
    const u = new URL(url);
    return `${u.hostname.replace('-pooler', '')}${u.pathname}`;
  } catch {
    return '';
  }
};

const target = readEnvFile('.env.loadtest').DATABASE_URL;
const production = readEnvFile('.env.local').DATABASE_URL;
if (!target) {
  console.error('No .env.loadtest.');
  process.exit(1);
}
if (production && endpointOf(target) === endpointOf(production)) {
  console.error('Refusing to run against production.');
  process.exit(1);
}
process.env.DATABASE_URL = target;

const { prisma } = await import('../lib/db/client');
const { parseUserFilters, userWhere, userOrderBy } = await import('../lib/admin-users');

async function ms<T>(fn: () => Promise<T>): Promise<[number, T]> {
  const t = process.hrtime.bigint();
  const out = await fn();
  return [Number(process.hrtime.bigint() - t) / 1e6, out];
}
const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(2)} s` : `${Math.round(n)} ms`);

const users = await prisma.user.count();
console.log(`accounts: ${users.toLocaleString()}`);

/** A quarter of attendees submit something — generous for a real conference. */
const authors = await prisma.user.findMany({
  where: { email: { endsWith: '@loadtest.invalid' } },
  select: { id: true },
  take: Math.floor(users / 4),
});

const BATCH = 20_000;
let made = 0;
for (let i = 0; i < authors.length; i += BATCH) {
  await prisma.projectSubmission.createMany({
    data: authors.slice(i, i + BATCH).map((a, j) => ({
      userId: a.id,
      titleAr: `[LT] مشروع ${i + j}`,
      summaryAr: 'اختبار حِمل',
      track: 'البحث العلمي',
      status: 'PENDING' as const,
    })),
  });
  made += Math.min(BATCH, authors.length - i);
}
console.log(`submissions: ${made.toLocaleString()}\n`);

for (const sort of ['recent', 'name', 'oldest', 'active'] as const) {
  const f = parseUserFilters({ sort });
  // Twice, reporting the second: the first pays for whatever the planner and
  // the cache had not seen yet.
  for (let i = 0; i < 2; i++) {
    const [t] = await ms(() =>
      prisma.user.findMany({
        where: userWhere(f), orderBy: userOrderBy(f.sort), take: 25,
        select: { id: true, name: true },
      }),
    );
    if (i === 1) console.log(`  sort=${sort.padEnd(8)} ${fmt(t)}`);
  }
}

// The plan, which says what is actually happening rather than how long it took.
const plan = await prisma.$queryRawUnsafe<{ 'QUERY PLAN': string }[]>(`
  EXPLAIN (ANALYZE, BUFFERS, TIMING OFF, SUMMARY ON)
  SELECT u.id FROM "User" u
  LEFT JOIN (SELECT "userId", COUNT(*) c FROM "ProjectSubmission" GROUP BY "userId") s
    ON s."userId" = u.id
  ORDER BY COALESCE(s.c, 0) DESC, u."createdAt" DESC
  LIMIT 25`);
console.log('\nwhat the database does for sort=active:');
for (const row of plan) console.log('  ' + row['QUERY PLAN']);

await prisma.projectSubmission.deleteMany({ where: { titleAr: { startsWith: '[LT]' } } });
await prisma.$disconnect();
process.exit(0);
