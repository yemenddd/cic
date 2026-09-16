/**
 * Creates (or updates the password of) the first admin account.
 *
 * Run once, after the database is connected and migrated:
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... npx tsx scripts/seed-admin.ts
 *
 * or set ADMIN_EMAIL / ADMIN_PASSWORD in .env.local and just run:
 *
 *   npx tsx scripts/seed-admin.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// See scripts note in the old migration script for why this can't be a
// static import at the top of the file: env vars must be loaded before
// lib/db/client (which reads them at module-evaluation time) is imported.
for (const file of ['.env.local', '.env']) {
  const path = join(process.cwd(), file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, 'utf-8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const [, key, rawValue = ''] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}

async function main() {
  const { prisma } = await import('../lib/db/client');
  const bcrypt = (await import('bcryptjs')).default;

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (in .env.local or as env vars) before running this script.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'ADMIN' },
    create: { email, passwordHash, role: 'ADMIN' },
  });

  console.log(`✓ Admin account ready: ${user.email}`);
}

main()
  .catch((err) => {
    console.error('Seeding admin failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import('../lib/db/client');
    await prisma.$disconnect();
  });
