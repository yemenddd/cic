/**
 * One-off content migration: copies the site's hardcoded speaker, program,
 * history, and achievement data into Sanity documents, so nothing is lost
 * when the components below switch to reading from the CMS.
 *
 * Run once, after creating your Sanity project and setting the env vars
 * from .env.example (NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET,
 * SANITY_API_TOKEN):
 *
 *   npx tsx scripts/migrate-to-sanity.ts
 *
 * NOT covered here — add these directly in the Studio (/studio) instead,
 * since they're plain media lists rather than exported data structures:
 *   - Partner logos        (10 items,  components/sections/Partners.tsx)
 *   - Gallery photos       (35 items,  components/sections/Gallery.tsx)
 *   - Film/TV video entries (23 items, components/sections/VideosPage.tsx)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Node has no built-in .env loader in this project's Node version — parse
// .env.local by hand so SANITY_API_TOKEN etc. are available below.
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

import { getWriteClient } from '../lib/sanity/client';
import { dict } from '../lib/dictionary';
import { ACHIEVEMENT_EDITIONS } from '../lib/achievements-data';

const client = getWriteClient();

function locale(en: string, ar: string, tr: string) {
  return { ar, en, tr };
}

async function migrateSpeakers() {
  const en = dict.en.speakers.list;
  const ar = dict.ar.speakers.list;
  const tr = dict.tr.speakers.list;

  for (let i = 0; i < ar.length; i++) {
    await client.create({
      _type: 'speaker',
      name: locale(en[i].name, ar[i].name, tr[i]?.name ?? ar[i].name),
      role: locale(en[i].role, ar[i].role, tr[i]?.role ?? ar[i].role),
      organization: locale(en[i].org, ar[i].org, tr[i]?.org ?? ar[i].org),
      topic: locale(en[i].topic, ar[i].topic, tr[i]?.topic ?? ar[i].topic),
      bio: locale(en[i].bio, ar[i].bio, tr[i]?.bio ?? ar[i].bio),
      order: i,
    });
  }
  console.log(`✓ Migrated ${ar.length} speakers`);
}

async function migrateHistoryEditions() {
  const en = dict.en.history.editions;
  const ar = dict.ar.history.editions;
  const tr = dict.tr.history.editions;

  for (let i = 0; i < ar.length; i++) {
    await client.create({
      _type: 'historyEdition',
      year: ar[i].year,
      title: locale(en[i].title, ar[i].title, tr[i]?.title ?? ar[i].title),
      description: locale(en[i].desc, ar[i].desc, tr[i]?.desc ?? ar[i].desc),
      attendees: ar[i].attendees,
      speakersCount: ar[i].speakers,
      order: i,
    });
  }
  console.log(`✓ Migrated ${ar.length} history editions`);
}

async function migrateProgramSessions() {
  const days: Array<'dayOne' | 'dayTwo'> = ['dayOne', 'dayTwo'];
  let count = 0;

  for (const day of days) {
    const en = dict.en.schedule[day];
    const ar = dict.ar.schedule[day];
    const tr = dict.tr.schedule[day];

    for (let i = 0; i < ar.length; i++) {
      await client.create({
        _type: 'programSession',
        day,
        time: ar[i].time,
        title: locale(en[i].title, ar[i].title, tr[i]?.title ?? ar[i].title),
        speakerName: locale(en[i].speaker, ar[i].speaker, tr[i]?.speaker ?? ar[i].speaker),
        speakerRole: locale(en[i].role, ar[i].role, tr[i]?.role ?? ar[i].role),
        color: ar[i].color,
        order: count++,
        // speakerPhoto is a local /public path (e.g. "/images/speakers/x.jpg") —
        // Sanity needs an uploaded image asset, not a URL string, so this field
        // is left empty here. Upload each session's photo in the Studio.
      });
    }
  }
  console.log(`✓ Migrated ${count} program sessions (add speaker photos in the Studio)`);
}

async function migrateAchievements() {
  let studentCount = 0;

  for (const edition of ACHIEVEMENT_EDITIONS) {
    const editionDoc = await client.create({
      _type: 'achievementEdition',
      slug: { _type: 'slug', current: edition.slug },
      number: edition.number,
      year: String(edition.year),
      order: edition.number,
    });

    for (const student of edition.students) {
      await client.create({
        _type: 'achievementStudent',
        edition: { _type: 'reference', _ref: editionDoc._id },
        studentId: student.id,
        name: student.name,
        members: student.members,
        projectTitle: { ar: student.projectAr, en: student.projectEn },
        role: student.role,
        videoId: student.videoId,
        color: student.color,
        order: studentCount,
        // photos are local /public paths — upload them in the Studio per
        // student, same reasoning as program session photos above.
      });
      studentCount++;
    }
  }
  console.log(`✓ Migrated ${ACHIEVEMENT_EDITIONS.length} achievement editions, ${studentCount} students (add photos in the Studio)`);
}

async function main() {
  console.log('Starting migration…\n');
  await migrateSpeakers();
  await migrateHistoryEditions();
  await migrateProgramSessions();
  await migrateAchievements();
  console.log('\nDone. Open /studio to review, then upload the remaining images (speaker/session/student photos, partner logos, gallery photos, videos) directly in the Studio UI.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
