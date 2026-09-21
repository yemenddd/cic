/**
 * A conference's worth of attendees, for trying the panel on something that
 * looks like a real list.
 *
 * Four accounts is not enough to find out whether the directory is usable: the
 * filters, the pagination, the search box, the attendance board and the CSV
 * export all behave differently against two hundred people than against four,
 * and so does the organiser reading them.
 *
 * Everything it writes is marked, and `clean` removes exactly what it wrote:
 *
 *   - every email ends in the seed domain below
 *   - every confirmation code starts SEED-
 *
 * Run with:
 *   npx tsx scripts/seed-attendees.mts 200      seed (idempotent — tops up)
 *   npx tsx scripts/seed-attendees.mts clean    remove every seeded row
 */
import { readFileSync } from 'node:fs';
import { randomInt } from 'node:crypto';

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
  if (m) process.env[m[1]] ??= m[2];
}

const { prisma } = await import('../lib/db/client');
const { SUBMISSION_TRACKS } = await import('../lib/submissions');

/** Not a real domain, and never will be — seeded people cannot receive mail. */
const DOMAIN = '@seed.cict.invalid';
const CODE_PREFIX = 'SEED-';

/**
 * One cost-12 hash, reused. These accounts are never signed into; hashing two
 * hundred passwords properly would take a minute and prove nothing. Nothing
 * hashes to this, so none of them can be signed into by guessing either.
 */
const HASH = '$2b$12$OhgroOi4ucfQy.WB2AdZfeD/VO3xaVZ0RXaIJS/80gXHuCTvBn9VK';

const FIRST_M = ['محمد', 'أحمد', 'عبدالله', 'خالد', 'عمر', 'يوسف', 'إبراهيم', 'سالم', 'طارق', 'زياد', 'حسن', 'مازن', 'أنس', 'بلال', 'رامي', 'سيف', 'ماهر', 'نبيل', 'وليد', 'هاني'];
const FIRST_F = ['ريم', 'نور', 'سارة', 'مريم', 'هديل', 'لمى', 'أسماء', 'رنا', 'دعاء', 'شيماء', 'إيمان', 'بشرى', 'سمية', 'هبة', 'رغد', 'جنى', 'ملك', 'آية', 'لينا', 'روان'];
const LAST = ['الشرعبي', 'العمري', 'الحضرمي', 'باسليم', 'الأهدل', 'المقطري', 'الزبيري', 'السقاف', 'الحمادي', 'الكبسي', 'النهمي', 'الريمي', 'المخلافي', 'الصبري', 'الشامي', 'العزاني', 'الحكيمي', 'الوصابي', 'الجرادي', 'المطري'];

const ORGS = ['جامعة صنعاء', 'جامعة عدن', 'جامعة تعز', 'جامعة إب', 'جامعة الحديدة', 'جامعة حضرموت', 'مؤسسة التنمية', 'مركز الابتكار', 'شركة تقنية', 'وزارة الاتصالات', 'منظمة إنسانية', 'مدرسة النور', 'معهد البرمجة', 'مستقل'];

/** Where the conference's people actually come from, roughly weighted. */
const COUNTRIES = [
  ...Array(70).fill('اليمن'),
  ...Array(45).fill('تركيا'),
  ...Array(20).fill('مصر'),
  ...Array(15).fill('السعودية'),
  ...Array(10).fill('الأردن'),
  ...Array(8).fill('ماليزيا'),
  ...Array(6).fill('الإمارات'),
  ...Array(4).fill('السودان'),
  ...Array(3).fill('قطر'),
  ...Array(2).fill('الكويت'),
];

/**
 * The real mix, not thirds. A conference is mostly visitors, with a smaller
 * body of people presenting and a small volunteer team — and the panel should
 * be tried against that shape, because it is the one that makes the
 * participant filter worth having.
 */
const CATEGORIES = [...Array(60).fill('visitor'), ...Array(30).fill('participant'), ...Array(10).fill('volunteer')];

const pick = <T,>(xs: T[]): T => xs[randomInt(xs.length)];

function codeFor(i: number): string {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return `${CODE_PREFIX}${String(i).padStart(4, '0')}-${Array.from({ length: 4 }, () => A[randomInt(A.length)]).join('')}`;
}

async function clean(): Promise<void> {
  // Registrations first: they point at the users, and the relation is optional
  // rather than cascading.
  const regs = await prisma.registration.deleteMany({
    where: { confirmationCode: { startsWith: CODE_PREFIX } },
  });
  // Submissions, saved sessions, notifications and attendance all cascade from
  // User, so deleting the accounts takes them.
  const users = await prisma.user.deleteMany({ where: { email: { endsWith: DOMAIN } } });
  console.log(`removed ${users.count} accounts and ${regs.count} registrations`);
}

async function seed(target: number): Promise<void> {
  const have = await prisma.user.count({ where: { email: { endsWith: DOMAIN } } });
  if (have >= target) {
    console.log(`already ${have} seeded accounts — nothing to add`);
    return;
  }

  const sessions = await prisma.programSession.findMany({ select: { id: true } });
  const now = Date.now();

  for (let i = have; i < target; i++) {
    const female = randomInt(2) === 0;
    const name = `${pick(female ? FIRST_F : FIRST_M)} ${pick(LAST)}`;
    const category = CATEGORIES[i % CATEGORIES.length];
    const email = `seed${String(i).padStart(4, '0')}${DOMAIN}`;

    // Spread over the six weeks before the conference, so "newest first" and
    // the date filters have something to sort.
    const createdAt = new Date(now - randomInt(42) * 86_400_000 - randomInt(86_400_000));

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: HASH,
        name,
        role: 'ATTENDEE',
        category,
        country: pick(COUNTRIES),
        organization: pick(ORGS),
        phone: `+9677${String(randomInt(100000000)).padStart(8, '0')}`,
        // Only some people choose a track, which is what makes the
        // certificate page's "no track" warning worth having.
        track: randomInt(10) < 6 ? pick(SUBMISSION_TRACKS) : null,
        confirmationCode: codeFor(i),
        createdAt,
      },
      select: { id: true, name: true, email: true, phone: true, country: true, organization: true, category: true, track: true, confirmationCode: true },
    });

    // The registration row the public form would have written.
    await prisma.registration.create({
      data: {
        fullName: user.name!,
        email: user.email,
        phone: user.phone,
        country: user.country,
        organization: user.organization,
        category: user.category!,
        track: user.track,
        confirmationCode: user.confirmationCode,
        userId: user.id,
        submittedAt: createdAt,
      },
    });

    // A saved agenda for about half of them.
    if (sessions.length > 0 && randomInt(2) === 0) {
      const chosen = new Set<string>();
      for (let k = 0; k < 1 + randomInt(4); k++) chosen.add(pick(sessions).id);
      for (const sessionId of chosen) {
        await prisma.savedSession.create({ data: { userId: user.id, sessionId } });
      }
    }

    // Participants present projects; nobody else can. Statuses spread across
    // the review pipeline so the committee queue is not all one colour.
    if (category === 'participant' && randomInt(10) < 7) {
      const STATUSES = ['DRAFT', 'PENDING', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] as const;
      const status = pick([...STATUSES]);
      await prisma.projectSubmission.create({
        data: {
          userId: user.id,
          titleAr: `مشروع ${pick(['تطبيق', 'منصة', 'نظام', 'جهاز', 'أداة'])} ${pick(['للتعليم', 'للصحة', 'للزراعة', 'للطاقة', 'للمياه'])}`,
          summaryAr: 'ملخّص تجريبي لمشروع مقدَّم ضمن بيانات الاختبار.',
          track: user.track ?? pick([...SUBMISSION_TRACKS]),
          status,
          submittedAt: status === 'DRAFT' ? null : createdAt,
          reviewedAt: status === 'APPROVED' || status === 'REJECTED' ? new Date(createdAt.getTime() + 86_400_000) : null,
          reviewNote: status === 'REJECTED' ? 'يحتاج تفصيلاً أوضح للأثر المتوقع.' : null,
        },
      });
    }

    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${target}`);
  }

  console.log(`seeded up to ${target}`);
}

const arg = process.argv[2] ?? '200';

if (arg === 'clean') {
  await clean();
} else {
  await seed(Number(arg));
}

const seeded = await prisma.user.count({ where: { email: { endsWith: DOMAIN } } });
const real = await prisma.user.count({ where: { email: { not: { endsWith: DOMAIN } } } });
console.log(`\nseeded accounts: ${seeded} | real accounts untouched: ${real}`);

await prisma.$disconnect();
process.exit(0);
