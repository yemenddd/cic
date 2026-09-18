/**
 * Checks the rules the platform enforces — who may present a project, what an
 * announcement is allowed to contain and who it reaches, and how hard the
 * login throttle bites. The database half writes real rows and then undoes
 * itself.
 *
 * Run with:  npm run check
 *
 * This deliberately covers decisions rather than rendering: a wrong answer
 * here is a security bug, and none of it was verifiable without clicking
 * through the panel until now.
 */
import { readFileSync } from 'node:fs';

// .env.local is not committed, so fall back to whatever is already exported
// rather than failing with a file-not-found nobody can act on.
try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
    if (m) process.env[m[1]] ??= m[2];
  }
} catch {
  if (!process.env.DATABASE_URL) {
    console.error('Set DATABASE_URL, or add a .env.local, before running the checks.');
    process.exit(1);
  }
}

// Imported dynamically: these modules read DATABASE_URL as they load, and a
// static import would be hoisted above the .env parsing above.
const { validateAnnouncement, deliverAnnouncement } = await import(
  '../app/admin/(panel)/announcements/send'
);
const { prisma } = await import('../lib/db/client');
const { canSubmitInnovations } = await import('../lib/categories');
const { lockSeconds, LOGIN_BY_EMAIL, LOGIN_BY_IP, REGISTER_BY_IP } = await import(
  '../lib/rate-limit'
);
const { relativeArabicDate } = await import('../lib/relative-time');
const { arabicCountBare, SESSION } = await import('../lib/arabic-plural');
const { daysUntilConference, conferenceStart } = await import('../lib/conference');

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? '✓' : '✗'} ${label}${ok ? '' : `\n    expected ${JSON.stringify(expected)}\n    got      ${JSON.stringify(actual)}`}`);
}

// --- who may present a project ----------------------------------------------

check('participants may submit innovations', canSubmitInnovations('participant'), true);
check('visitors may not', canSubmitInnovations('visitor'), false);
check('volunteers may not', canSubmitInnovations('volunteer'), false);
check('an unknown category may not', canSubmitInnovations('vip'), false);
check('a missing category may not', canSubmitInnovations(null), false);

// --- how hard the login throttle bites ---------------------------------------

check('four failures cost nothing', lockSeconds(4, LOGIN_BY_EMAIL), 0);
check('the fifth locks for a minute', lockSeconds(5, LOGIN_BY_EMAIL), 60);
check('each further failure doubles it', lockSeconds(7, LOGIN_BY_EMAIL), 240);
check('the per-account lock is capped at 15 minutes', lockSeconds(50, LOGIN_BY_EMAIL), 900);
check('an absurd count still clamps, not Infinity', lockSeconds(1e9, LOGIN_BY_EMAIL), 900);
check('one address gets 19 tries across accounts', lockSeconds(19, LOGIN_BY_IP), 0);
check('the twentieth locks the address', lockSeconds(20, LOGIN_BY_IP), 60);
check('bulk signups are capped at an hour', lockSeconds(99, REGISTER_BY_IP), 3600);

// --- Arabic counting, which has four forms rather than two -------------------

const NOW = new Date('2026-09-18T12:00:00Z');
const ago = (ms: number) => relativeArabicDate(new Date(NOW.getTime() - ms), NOW);
const MIN = 60_000;

check('under a minute reads as now', ago(30_000), 'الآن');
check('one minute is singular', ago(MIN), 'قبل دقيقة');
check('two minutes use the dual, with no digit', ago(2 * MIN), 'قبل دقيقتين');
check('four minutes take the few-plural', ago(4 * MIN), 'قبل 4 دقائق');
check('twenty minutes go back to the singular noun', ago(20 * MIN), 'قبل 20 دقيقة');
check('two hours use the dual', ago(120 * MIN), 'قبل ساعتين');
check('five hours take the few-plural', ago(300 * MIN), 'قبل 5 ساعات');
check('two days use the dual', ago(2 * 1440 * MIN), 'قبل يومين');
check('three days take the few-plural', ago(3 * 1440 * MIN), 'قبل 3 أيام');
check('a future timestamp never goes negative', relativeArabicDate(new Date(NOW.getTime() + MIN), NOW), 'الآن');

check('one session is bare singular', arabicCountBare(1, SESSION), 'جلسة');
check('two sessions use the dual with no digit', arabicCountBare(2, SESSION), 'جلستين');
check('four sessions take the few-plural', arabicCountBare(4, SESSION), '4 جلسات');
check('twelve sessions go back to the singular noun', arabicCountBare(12, SESSION), '12 جلسة');

// --- the conference dates, which several features compute from ---------------

check('day one starts at 09:00 local (UTC+3)', conferenceStart().toISOString(), '2026-10-02T06:00:00.000Z');
check('the countdown counts down', daysUntilConference(new Date('2026-09-28T06:00:00Z')), 4);
check('it reaches zero on the day', daysUntilConference(new Date('2026-10-02T06:00:00Z')), 0);
check('and goes negative afterwards, so callers can stop counting', daysUntilConference(new Date('2026-10-05T06:00:00Z')) < 0, true);

// --- what an announcement may contain ----------------------------------------

const base = { title: 'عنوان', body: 'نص', link: '', audience: 'all' };

check('empty title is refused', validateAnnouncement({ ...base, title: '' }), 'عنوان الإعلان مطلوب');
check('empty body is refused', validateAnnouncement({ ...base, body: '' }), 'نص الإعلان مطلوب');
check('over-long title is refused', validateAnnouncement({ ...base, title: 'ء'.repeat(121) }), 'العنوان طويل جداً — 120 حرفاً كحد أقصى');
check('unknown audience is refused', validateAnnouncement({ ...base, audience: 'hackers' }), 'الفئة المستهدفة غير صالحة');

const LINK_ERROR = 'الرابط يجب أن يكون مساراً داخلياً يبدأ بـ / مثل /program';
check('absolute URL is refused', validateAnnouncement({ ...base, link: 'https://evil.example' }), LINK_ERROR);
check('protocol-relative URL is refused', validateAnnouncement({ ...base, link: '//evil.example' }), LINK_ERROR);
check('backslash trick is refused', validateAnnouncement({ ...base, link: '/\\evil.example' }), LINK_ERROR);
check('bare word is refused', validateAnnouncement({ ...base, link: 'program' }), LINK_ERROR);
check('internal path is accepted', validateAnnouncement({ ...base, link: '/program' }), null);
check('valid input passes', validateAnnouncement(base), null);

// --- the delivery half, against real rows -----------------------------------

const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
if (!admin) throw new Error('no admin in the database to attribute the send to');

const expected = await prisma.user.count({ where: { role: 'ATTENDEE', category: 'visitor' } });
const before = await prisma.notification.count();

const marker = `[check ${Date.now()}]`;
const result = await deliverAnnouncement(admin.id, {
  title: marker,
  body: 'رسالة تحقق مؤقتة',
  link: '/program',
  audience: 'visitor',
});

check('delivered to exactly the visitor tier', result, { sent: expected });

const created = await prisma.notification.findMany({ where: { title: marker } });
check('one notification per recipient', created.length, expected);
check('no other feed was touched', await prisma.notification.count(), before + expected);

const record = await prisma.announcement.findFirst({ where: { title: marker } });
check('an audit record was written', record?.recipients, expected);
check('the audit record names the sender', record?.sentById, admin.id);

const recipients = await prisma.user.findMany({
  where: { id: { in: created.map((n) => n.userId) } },
  select: { role: true, category: true },
});
check(
  'every recipient really is a visitor-tier attendee',
  recipients.every((r) => r.role === 'ATTENDEE' && r.category === 'visitor'),
  true,
);

// --- undo --------------------------------------------------------------------

await prisma.notification.deleteMany({ where: { title: marker } });
await prisma.announcement.deleteMany({ where: { title: marker } });
check('test data removed', await prisma.notification.count(), before);

await prisma.$disconnect();
console.log(failures === 0 ? '\nall checks passed' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
