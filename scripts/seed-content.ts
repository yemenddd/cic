/**
 * One-off content seed: copies the site's hardcoded speaker, program,
 * history, and achievement data into the database, so nothing is lost when
 * pages switch to reading from the CMS instead of the local fallback data.
 *
 * Run once, after the database is connected and migrated:
 *
 *   npx tsx scripts/seed-content.ts
 *
 * NOT covered here — add these directly in the admin panel (/admin) instead,
 * since they're plain media lists rather than exported data structures:
 *   - Partner logos         (10 items,  components/sections/Partners.tsx)
 *   - Gallery photos        (35 items,  components/sections/Gallery.tsx)
 *   - Film/TV video entries (23 items, components/sections/VideosPage.tsx)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// See the note in scripts/seed-admin.ts — env vars must be loaded before
// lib/db/client is imported, which is why the imports below are dynamic.
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
  const { dict } = await import('../lib/dictionary');
  const { ACHIEVEMENT_EDITIONS } = await import('../lib/achievements-data');

  await seedSpeakers(prisma, dict);
  await seedHistoryEditions(prisma, dict);
  await seedProgramSessions(prisma, dict);
  await seedAchievements(prisma, ACHIEVEMENT_EDITIONS);

  console.log('\nDone. Open /admin to review, then add the remaining images (speaker/session/student photos, partner logos, gallery photos, videos) directly in the admin panel.');
}

type Prisma = typeof import('../lib/db/client').prisma;
type Dict = typeof import('../lib/dictionary').dict;
type AchievementEditions = typeof import('../lib/achievements-data').ACHIEVEMENT_EDITIONS;

async function seedSpeakers(prisma: Prisma, dict: Dict) {
  const en = dict.en.speakers.list;
  const ar = dict.ar.speakers.list;
  const tr = dict.tr.speakers.list;

  for (let i = 0; i < ar.length; i++) {
    await prisma.speaker.create({
      data: {
        nameAr: ar[i].name, nameEn: en[i]?.name, nameTr: tr[i]?.name,
        roleAr: ar[i].role, roleEn: en[i]?.role, roleTr: tr[i]?.role,
        organizationAr: ar[i].org, organizationEn: en[i]?.org, organizationTr: tr[i]?.org,
        topicAr: ar[i].topic, topicEn: en[i]?.topic, topicTr: tr[i]?.topic,
        bioAr: ar[i].bio, bioEn: en[i]?.bio, bioTr: tr[i]?.bio,
        order: i,
      },
    });
  }
  console.log(`✓ Seeded ${ar.length} speakers`);
}

async function seedHistoryEditions(prisma: Prisma, dict: Dict) {
  const en = dict.en.history.editions;
  const ar = dict.ar.history.editions;
  const tr = dict.tr.history.editions;

  for (let i = 0; i < ar.length; i++) {
    // Bound to a local so the `in` checks below actually narrow: TypeScript
    // does not carry a narrowing across repeated `ar[i]` index expressions.
    const edition = ar[i];
    await prisma.historyEdition.create({
      data: {
        year: edition.year,
        titleAr: edition.title, titleEn: en[i]?.title, titleTr: tr[i]?.title,
        descriptionAr: edition.desc, descriptionEn: en[i]?.desc, descriptionTr: tr[i]?.desc,
        // Absent on an edition that has not happened yet — there is no
        // attendance to report before the doors open.
        attendees: 'attendees' in edition ? edition.attendees : null,
        speakersCount: 'speakers' in edition ? edition.speakers : null,
        order: i,
      },
    });
  }
  console.log(`✓ Seeded ${ar.length} history editions`);
}

async function seedProgramSessions(prisma: Prisma, dict: Dict) {
  const days: Array<'dayOne' | 'dayTwo'> = ['dayOne', 'dayTwo'];
  let count = 0;

  for (const day of days) {
    const en = dict.en.schedule[day];
    const ar = dict.ar.schedule[day];
    const tr = dict.tr.schedule[day];

    for (let i = 0; i < ar.length; i++) {
      await prisma.programSession.create({
        data: {
          day,
          time: ar[i].time,
          titleAr: ar[i].title, titleEn: en[i]?.title, titleTr: tr[i]?.title,
          speakerNameAr: ar[i].speaker, speakerNameEn: en[i]?.speaker, speakerNameTr: tr[i]?.speaker,
          speakerRoleAr: ar[i].role, speakerRoleEn: en[i]?.role, speakerRoleTr: tr[i]?.role,
          color: ar[i].color,
          order: count++,
          // speakerPhotoUrl is left empty here — the source data points at
          // local /public paths, not uploaded blobs. Add each photo in /admin.
        },
      });
    }
  }
  console.log(`✓ Seeded ${count} program sessions (add speaker photos in /admin)`);
}

async function seedAchievements(prisma: Prisma, editions: AchievementEditions) {
  let studentCount = 0;

  for (const edition of editions) {
    const editionRow = await prisma.achievementEdition.create({
      data: {
        slug: edition.slug,
        number: edition.number,
        year: String(edition.year),
        order: edition.number,
      },
    });

    for (const student of edition.students) {
      await prisma.achievementStudent.create({
        data: {
          editionId: editionRow.id,
          studentId: student.id,
          name: student.name,
          members: student.members ?? [],
          projectTitleAr: student.projectAr,
          projectTitleEn: student.projectEn,
          role: student.role,
          videoId: student.videoId,
          color: student.color,
          order: studentCount,
          // photoUrls left empty — source photos are local /public paths, not
          // uploaded blobs. Add each student's photos in /admin.
        },
      });
      studentCount++;
    }
  }
  console.log(`✓ Seeded ${editions.length} achievement editions, ${studentCount} students (add photos in /admin)`);
}

main()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import('../lib/db/client');
    await prisma.$disconnect();
  });
