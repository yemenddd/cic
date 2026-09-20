/**
 * The other half of "a lot of users": a lot of them at the same time.
 *
 * scripts/loadtest.mts answers how one query behaves as the table grows. This
 * answers what happens when many people hit the site at once — which is a
 * different limit entirely, and the one a conference actually reaches when the
 * doors open and everybody opens their badge in the same minute.
 *
 * Runs against the pooled endpoint, because that is what the deployed app uses.
 *
 * Run with:  npx tsx scripts/loadtest-concurrent.mts 10,50,100,200
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

function endpointOf(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace('-pooler', '')}${u.pathname}`;
  } catch {
    return '';
  }
}

const env = readEnvFile('.env.loadtest');
const target = env.DATABASE_URL_POOLED ?? env.DATABASE_URL;
const production = readEnvFile('.env.local').DATABASE_URL;

if (!target) {
  console.error('No .env.loadtest. See scripts/loadtest.mts for how to make one.');
  process.exit(1);
}
if (production && endpointOf(target) === endpointOf(production)) {
  console.error(`Refusing to run against production (${endpointOf(target)}).`);
  process.exit(1);
}

process.env.DATABASE_URL = target;
console.log(`target: ${new URL(target).hostname}`);

const { prisma } = await import('../lib/db/client');

const DOMAIN = '@loadtest.invalid';

/** One attendee opening their dashboard: exactly the queries that page runs. */
async function oneDashboard(userId: string): Promise<void> {
  await Promise.all([
    prisma.notification.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' }, take: 20,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
    prisma.savedSession.findMany({ where: { userId } }),
    prisma.projectSubmission.findMany({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, category: true, confirmationCode: true },
    }),
  ]);
}

async function burst(concurrency: number, ids: string[]): Promise<void> {
  const latencies: number[] = [];
  let failed = 0;
  let firstError = '';

  const t0 = Date.now();
  await Promise.all(
    Array.from({ length: concurrency }, async (_unused, i) => {
      const started = process.hrtime.bigint();
      try {
        await oneDashboard(ids[i % ids.length]);
        latencies.push(Number(process.hrtime.bigint() - started) / 1e6);
      } catch (err) {
        failed++;
        if (!firstError) firstError = err instanceof Error ? err.message.split('\n')[0] : String(err);
      }
    }),
  );
  const wall = Date.now() - t0;

  latencies.sort((a, b) => a - b);
  const at = (p: number) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))] ?? 0;
  const ok = latencies.length;

  console.log(
    `  ${String(concurrency).padStart(4)} at once  ` +
      `wall ${String(wall).padStart(6)} ms  ` +
      `median ${String(Math.round(at(0.5))).padStart(5)} ms  ` +
      `p95 ${String(Math.round(at(0.95))).padStart(6)} ms  ` +
      `max ${String(Math.round(at(1))).padStart(6)} ms  ` +
      `ok ${ok}/${concurrency}` +
      (failed ? `  FAILED ${failed}` : ''),
  );
  if (firstError) console.log(`        first error: ${firstError}`);
}

// --- run ---------------------------------------------------------------------

const ids = (
  await prisma.user.findMany({
    where: { email: { endsWith: DOMAIN } }, select: { id: true }, take: 500,
  })
).map((u) => u.id);

if (ids.length === 0) {
  console.error(
    'No seeded accounts found. Seed first and leave them in place:\n' +
      '  npx tsx scripts/loadtest.mts seed 10000\n',
  );
  process.exit(1);
}

console.log(`${ids.length} seeded accounts to read from`);
console.log(`total accounts: ${(await prisma.user.count()).toLocaleString()}\n`);

// Warm the pool and the compute before measuring.
await burst(5, ids);
console.log('  (above is the warm-up)\n');

for (const c of (process.argv[2] ?? '10,50,100,250,500').split(',').map(Number)) {
  await burst(c, ids);
}

await prisma.$disconnect();
process.exit(0);
