import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/client';
import { dict } from '@/lib/dictionary';
import { ACHIEVEMENT_EDITIONS } from '@/lib/achievements-data';

// TEMPORARY, ONE-TIME SETUP ROUTE — creates the first admin account and
// seeds the existing hardcoded content into the database on first deploy.
// Gated by AUTH_SECRET so it can't be triggered by anyone else. Safe to call
// more than once: every step checks whether it already ran before writing.
// Delete this route once setup is confirmed working.
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (!secret || secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const result: Record<string, string> = {};

  // 1. Admin account
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.adminUser.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash },
    });
    result.admin = `ready (${email})`;
  } else {
    result.admin = 'skipped — ADMIN_EMAIL/ADMIN_PASSWORD not set';
  }

  // 2. Speakers
  if ((await prisma.speaker.count()) === 0) {
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
    result.speakers = `seeded ${ar.length}`;
  } else {
    result.speakers = 'already seeded';
  }

  // 3. History editions
  if ((await prisma.historyEdition.count()) === 0) {
    const en = dict.en.history.editions;
    const ar = dict.ar.history.editions;
    const tr = dict.tr.history.editions;
    for (let i = 0; i < ar.length; i++) {
      await prisma.historyEdition.create({
        data: {
          year: ar[i].year,
          titleAr: ar[i].title, titleEn: en[i]?.title, titleTr: tr[i]?.title,
          descriptionAr: ar[i].desc, descriptionEn: en[i]?.desc, descriptionTr: tr[i]?.desc,
          attendees: ar[i].attendees,
          speakersCount: ar[i].speakers,
          order: i,
        },
      });
    }
    result.history = `seeded ${ar.length}`;
  } else {
    result.history = 'already seeded';
  }

  // 4. Program sessions
  if ((await prisma.programSession.count()) === 0) {
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
          },
        });
      }
    }
    result.program = `seeded ${count}`;
  } else {
    result.program = 'already seeded';
  }

  // 5. Achievements
  if ((await prisma.achievementEdition.count()) === 0) {
    let studentCount = 0;
    for (const edition of ACHIEVEMENT_EDITIONS) {
      const editionRow = await prisma.achievementEdition.create({
        data: { slug: edition.slug, number: edition.number, year: String(edition.year), order: edition.number },
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
          },
        });
        studentCount++;
      }
    }
    result.achievements = `seeded ${ACHIEVEMENT_EDITIONS.length} editions, ${studentCount} students`;
  } else {
    result.achievements = 'already seeded';
  }

  return NextResponse.json({ ok: true, result });
}
