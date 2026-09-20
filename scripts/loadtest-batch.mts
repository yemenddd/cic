/**
 * How big should a page be?
 *
 * Paging fixed the memory but multiplied the round trips, and from a laptop
 * roughly 4,000 km from the database each round trip costs more than the query
 * inside it. This separates the two so the page size is chosen from evidence
 * rather than from the first round number that came to mind.
 *
 * Run with:  npx tsx scripts/loadtest-batch.mts
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
const { inPages } = await import('../lib/export-pages');

const DOMAIN = '@loadtest.invalid';
const MARK = '[LT]';

async function ms<T>(fn: () => Promise<T>): Promise<[number, T]> {
  const t = process.hrtime.bigint();
  const out = await fn();
  return [Number(process.hrtime.bigint() - t) / 1e6, out];
}
const s = (n: number) => `${(n / 1000).toFixed(2)}s`;

// --- what one round trip costs, with no work in it ---------------------------

const rtts: number[] = [];
for (let i = 0; i < 12; i++) {
  const [t] = await ms(() => prisma.$queryRawUnsafe('SELECT 1'));
  if (i >= 2) rtts.push(t); // discard the first two, which include the connect
}
rtts.sort((a, b) => a - b);
const rtt = rtts[Math.floor(rtts.length / 2)];
console.log(`round trip to the database: ${rtt.toFixed(0)} ms (median of ${rtts.length})\n`);

const total = await prisma.user.count();
console.log(`accounts in the table: ${total.toLocaleString()}\n`);

// --- reading: page size vs total time ----------------------------------------

console.log('EXPORT — reading every account, a page at a time');
console.log('  page size     time      round trips   network share   peak heap');

for (const size of [1000, 5000, 20000, 50000]) {
  if (global.gc) global.gc();
  const baseline = process.memoryUsage().heapUsed;
  let peak = 0;
  let rows = 0;
  let trips = 0;

  const [t] = await ms(async () => {
    const pages = inPages(
      (after, take) =>
        prisma.user.findMany({
          orderBy: [{ role: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
          ...(after ? { cursor: { id: after }, skip: 1 } : {}),
          take,
          select: {
            id: true, name: true, email: true, phone: true, country: true,
            organization: true, role: true, category: true, track: true,
            confirmationCode: true, createdAt: true,
            _count: { select: { submissions: true, savedSessions: true, attendance: true } },
          },
        }),
      size,
    );
    for await (const page of pages) {
      trips++;
      rows += page.length;
      page.map((u) => [u.name, u.email, u.phone, u._count.attendance]);
      peak = Math.max(peak, process.memoryUsage().heapUsed - baseline);
    }
  });

  const networkShare = ((trips * rtt) / t) * 100;
  console.log(
    `  ${String(size).padStart(6)}    ${s(t).padStart(8)}   ${String(trips).padStart(8)}   ` +
      `${networkShare.toFixed(0).padStart(11)}%   ${String(Math.round(peak / 1048576)).padStart(7)} MB   (${rows.toLocaleString()} rows)`,
  );
}

// --- writing: batch size vs total time ---------------------------------------

console.log('\nBROADCAST — writing one notification per attendee');
console.log('  batch size    time      round trips   network share');

const recipients = (
  await prisma.user.findMany({ where: { email: { endsWith: DOMAIN } }, select: { id: true } })
).map((u) => u.id);

for (const size of [1000, 5000, 20000]) {
  const title = `${MARK} batch ${size}`;
  let trips = 0;

  const [t] = await ms(async () => {
    for (let i = 0; i < recipients.length; i += size) {
      trips++;
      await prisma.notification.createMany({
        data: recipients.slice(i, i + size).map((userId) => ({
          userId, title, body: 'batch sizing test', link: null, kind: 'ANNOUNCEMENT' as const,
        })),
      });
    }
  });

  const networkShare = ((trips * rtt) / t) * 100;
  console.log(
    `  ${String(size).padStart(6)}    ${s(t).padStart(8)}   ${String(trips).padStart(8)}   ` +
      `${networkShare.toFixed(0).padStart(11)}%   (${recipients.length.toLocaleString()} notifications)`,
  );

  await prisma.notification.deleteMany({ where: { title } });
}

// One insert for the whole lot, which is what the code used to do.
{
  const title = `${MARK} single`;
  const [t] = await ms(() =>
    prisma.notification.createMany({
      data: recipients.map((userId) => ({
        userId, title, body: 'batch sizing test', link: null, kind: 'ANNOUNCEMENT' as const,
      })),
    }),
  );
  console.log(`  ${'all'.padStart(6)}    ${s(t).padStart(8)}   ${String(1).padStart(8)}   (the old behaviour)`);
  await prisma.notification.deleteMany({ where: { title } });
}

await prisma.notification.deleteMany({ where: { title: { startsWith: MARK } } });
await prisma.$disconnect();
process.exit(0);
