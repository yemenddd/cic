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
const { isInternalPath, openAndResolveTarget, NOTIFICATIONS_PATH } = await import(
  '../app/dashboard/notifications/open'
);
const { canSubmitInnovations } = await import('../lib/categories');
const { isTrackAllowed } = await import('../lib/submissions');
const { lockSeconds, LOGIN_BY_EMAIL, LOGIN_BY_IP, REGISTER_BY_IP } = await import(
  '../lib/rate-limit'
);
const { relativeArabicDate } = await import('../lib/relative-time');
const { arabicCountBare, SESSION } = await import('../lib/arabic-plural');
const { daysUntilConference, conferenceStart, conferenceEnd, conferenceHasEnded } = await import('../lib/conference');
const { badgeToken, verifyBadgeToken } = await import('../lib/badge-token');
const { qrMatrix, qrPath } = await import('../lib/qr');
const jsQR = (await import('jsqr')).default;
const { activeDayKey, attendanceRate, suggestedCheckpoint } = await import('../lib/attendance');
const { parseScanInput, recordAttendance } = await import('../lib/attendance-record');

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

// --- which track an attendee may store on their certificate ------------------

check('a track from the offered list is accepted', isTrackAllowed('البحث العلمي', null), true);
check('clearing the track is allowed', isTrackAllowed('', 'البحث العلمي'), true);
check('an invented track is refused', isTrackAllowed('مسار مخترع', 'البحث العلمي'), false);
check('a legacy value the account already holds is kept', isTrackAllowed('مسار قديم', 'مسار قديم'), true);
check('but not one held by somebody else', isTrackAllowed('مسار قديم', 'البحث العلمي'), false);

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

check('the conference ends at midnight after day two', conferenceEnd().toISOString(), '2026-10-03T21:00:00.000Z');
check('a certificate is not issuable two weeks early', conferenceHasEnded(new Date('2026-09-18T12:00:00Z')), false);
check('nor on the morning of day one', conferenceHasEnded(new Date('2026-10-02T06:00:00Z')), false);
check('nor during the final afternoon', conferenceHasEnded(new Date('2026-10-03T13:00:00Z')), false);
check('but is once the last day is over', conferenceHasEnded(new Date('2026-10-03T21:00:00Z')), true);
check('and stays issuable afterwards', conferenceHasEnded(new Date('2026-11-01T00:00:00Z')), true);

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

// --- opening a notification, which decides a redirect target -----------------

check('an internal path is internal', isInternalPath('/dashboard/innovations'), true);
check('a protocol-relative URL is not', isInternalPath('//evil.example'), false);
check('a backslash trick is not', isInternalPath('/\\evil.example'), false);
check('an absolute URL is not', isInternalPath('https://evil.example'), false);
check('a missing link is not', isInternalPath(null), false);

const owner = await prisma.user.findFirst({ where: { role: 'ATTENDEE' }, select: { id: true } });
const other = await prisma.user.findFirst({
  where: { role: 'ATTENDEE', id: { not: owner?.id ?? '' } },
  select: { id: true },
});

if (owner && other) {
  const mine = await prisma.notification.create({
    data: { userId: owner.id, title: '[check] open', body: 'x', link: '/dashboard/innovations' },
  });
  const external = await prisma.notification.create({
    data: { userId: owner.id, title: '[check] external', body: 'x', link: 'https://evil.example' },
  });

  // The outsider goes first, so "still unread" afterwards proves their attempt
  // wrote nothing — run second, the owner's own open would have masked it.
  check(
    "somebody else's notification resolves to the feed",
    await openAndResolveTarget(other.id, mine.id),
    NOTIFICATIONS_PATH,
  );
  check(
    'and their attempt marks nothing read',
    (await prisma.notification.findUnique({ where: { id: mine.id } }))?.read,
    false,
  );

  check('opening returns the stored link', await openAndResolveTarget(owner.id, mine.id), '/dashboard/innovations');
  check('and marks it read', (await prisma.notification.findUnique({ where: { id: mine.id } }))?.read, true);

  check('an external stored link is refused', await openAndResolveTarget(owner.id, external.id), NOTIFICATIONS_PATH);

  await prisma.notification.deleteMany({ where: { title: { startsWith: '[check] ' } } });
  check('open-test rows removed', await prisma.notification.count({ where: { title: { startsWith: '[check] ' } } }), 0);
}

// --- the badge a QR code carries ---------------------------------------------
//
// This is the whole security story of attendance: if a token can be forged,
// the attendance figures — and the certificates issued from them — are fiction.

const SUBJECT = 'ckuser000000000000000000';
const TOKEN = badgeToken(SUBJECT);

check('a badge token resolves back to its account', verifyBadgeToken(TOKEN), SUBJECT);
check('the same account always gets the same token', badgeToken(SUBJECT), TOKEN);
check('a different account gets a different one', badgeToken('ckuser000000000000000001') === TOKEN, false);
check('a tampered signature is refused', verifyBadgeToken(TOKEN.slice(0, -1) + (TOKEN.endsWith('A') ? 'B' : 'A')), null);
check('a swapped subject is refused', verifyBadgeToken(TOKEN.replace(SUBJECT, 'ckuser000000000000000002')), null);
check('an unsigned lookalike is refused', verifyBadgeToken('CICT1.ckuser000000000000000000.AAAAAAAAAAAAAAAAAAAAAA'), null);
check('a random string is refused', verifyBadgeToken('hello'), null);
check('an empty string is refused', verifyBadgeToken(''), null);

// The symbol has to be small enough for a phone camera to resolve at arm's
// length; anything past version 10 (57 modules) starts failing on a cheap one.
check('the badge QR stays a small, scannable version', qrMatrix(TOKEN).size <= 45, true);

/**
 * The badge, read back by the same decoder the scanner uses.
 *
 * This rasterizes the SVG path the component actually ships — not the matrix
 * it was built from — so a path that transposed rows and columns, or dropped
 * the quiet zone, fails here rather than at a door on the morning of day one.
 * Nothing else in the platform would have caught it: a mirrored QR still looks
 * exactly like a QR.
 */
function decodeBadgeSymbol(payload: string): string | null {
  const matrix = qrMatrix(payload);
  const MARGIN = 2;
  const SCALE = 4;
  const side = (matrix.size + MARGIN * 2) * SCALE;
  const px = new Uint8ClampedArray(side * side * 4).fill(255);

  for (const [, xs, ys, ws] of qrPath(matrix).matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
    const x0 = (Number(xs) + MARGIN) * SCALE;
    const y0 = (Number(ys) + MARGIN) * SCALE;
    for (let y = y0; y < y0 + SCALE; y++) {
      for (let x = x0; x < x0 + Number(ws) * SCALE; x++) {
        const i = (y * side + x) * 4;
        px[i] = px[i + 1] = px[i + 2] = 0;
      }
    }
  }

  return jsQR(px, side, side)?.data ?? null;
}

check('the symbol a badge ships decodes back to its token', decodeBadgeSymbol(TOKEN), TOKEN);
check('and that token still resolves to the account', verifyBadgeToken(decodeBadgeSymbol(TOKEN) ?? ''), SUBJECT);

// --- reading whatever came out of the camera ---------------------------------

check('a signed token is read as a token', parseScanInput(TOKEN), { kind: 'token', userId: SUBJECT });
check('surrounding whitespace is tolerated', parseScanInput(`  ${TOKEN}\n`), { kind: 'token', userId: SUBJECT });
check(
  'a token wrapped in a URL by a generic camera app still reads',
  parseScanInput(`https://cict2026.com/b/${TOKEN}`),
  { kind: 'token', userId: SUBJECT },
);
check('a confirmation code is read as a code', parseScanInput('CICT-2026-ABC234'), { kind: 'code', code: 'CICT-2026-ABC234' });
check('a code typed in lowercase is accepted', parseScanInput('cict-2026-abc234'), { kind: 'code', code: 'CICT-2026-ABC234' });
check('a code with the ambiguous glyphs is refused', parseScanInput('CICT-2026-ABC01O'), { kind: 'unreadable' });
check('a forged token is not downgraded to a code lookup', parseScanInput('CICT1.ckuser000000000000000000.AAAAAAAAAAAAAAAAAAAAAA'), { kind: 'unreadable' });
check('a product barcode is unreadable', parseScanInput('5901234123457'), { kind: 'unreadable' });
check('an empty scan is unreadable', parseScanInput('   '), { kind: 'unreadable' });

// --- which conference day it is, in the venue's timezone ---------------------

check('the morning of day one is day one', activeDayKey(new Date('2026-10-02T06:00:00Z')), 'dayOne');
// 00:30 Istanbul on day two is 21:30 UTC on day one. A server reading its own
// clock would file this under the wrong day — and the wrong day's total is
// what the organizers read off the board.
check('half past midnight on day two is day two', activeDayKey(new Date('2026-10-02T21:30:00Z')), 'dayTwo');
check('the last minute of day two is still day two', activeDayKey(new Date('2026-10-03T20:59:00Z')), 'dayTwo');
check('the day before is neither', activeDayKey(new Date('2026-10-01T12:00:00Z')), null);
check('the day after is neither', activeDayKey(new Date('2026-10-04T12:00:00Z')), null);

// --- turnout ------------------------------------------------------------------

check('turnout with nobody registered is zero, not NaN', attendanceRate(0, 0), 0);
check('turnout rounds down', attendanceRate(97, 100), 97);
check('999 of 1000 is 99%, never 100%', attendanceRate(999, 1000), 99);
check('everybody present is 100%', attendanceRate(50, 50), 100);

// --- which checkpoint a scanner opens on --------------------------------------

const GATES = [
  { id: 'g1', day: 'dayOne', kind: 'GATE' as const, isOpen: true },
  { id: 'g2', day: 'dayTwo', kind: 'GATE' as const, isOpen: true },
  { id: 's2', day: 'dayTwo', kind: 'SESSION' as const, isOpen: true },
];

check("it opens on today's gate", suggestedCheckpoint(GATES, new Date('2026-10-03T08:00:00Z'))?.id, 'g2');
check('before the conference it falls back to the first gate', suggestedCheckpoint(GATES, new Date('2026-09-01T08:00:00Z'))?.id, 'g1');
check(
  'a closed gate is skipped for an open room on the same day',
  suggestedCheckpoint(
    GATES.map((g) => (g.id === 'g2' ? { ...g, isOpen: false } : g)),
    new Date('2026-10-03T08:00:00Z'),
  )?.id,
  's2',
);
check('with everything closed it opens on nothing', suggestedCheckpoint(GATES.map((g) => ({ ...g, isOpen: false }))), null);

// --- taking attendance, against real rows -------------------------------------

const scanned = await prisma.user.findFirst({ where: { role: 'ATTENDEE' }, select: { id: true } });

if (scanned) {
  const gate = await prisma.checkpoint.create({
    data: { nameAr: `[check] gate ${Date.now()}`, day: 'dayOne', kind: 'GATE', isOpen: true },
  });

  const first = await recordAttendance({
    checkpointId: gate.id,
    raw: badgeToken(scanned.id),
    method: 'QR',
    recordedById: admin.id,
  });
  check('a valid badge is counted', first.status, 'recorded');

  // The point of the unique pair: a scanner pointed at a queue decodes the
  // same badge dozens of times while it is held up.
  const again = await recordAttendance({
    checkpointId: gate.id,
    raw: badgeToken(scanned.id),
    method: 'QR',
    recordedById: admin.id,
  });
  check('the same badge again is a duplicate, not a second row', again.status, 'duplicate');
  check('and only one row exists', await prisma.attendance.count({ where: { checkpointId: gate.id } }), 1);

  check(
    'a forged badge counts nobody',
    (await recordAttendance({
      checkpointId: gate.id,
      raw: 'CICT1.ckuser000000000000000000.AAAAAAAAAAAAAAAAAAAAAA',
      method: 'QR',
      recordedById: admin.id,
    })).status,
    'unreadable',
  );

  check(
    'a well-formed code nobody holds counts nobody',
    (await recordAttendance({
      checkpointId: gate.id,
      raw: 'CICT-2026-ZZZZZZ',
      method: 'QR',
      recordedById: admin.id,
    })).status,
    'unknown',
  );

  await prisma.checkpoint.update({ where: { id: gate.id }, data: { isOpen: false } });
  const other = await prisma.user.findFirst({
    where: { role: 'ATTENDEE', id: { not: scanned.id } },
    select: { id: true },
  });
  if (other) {
    check(
      'a closed checkpoint refuses new scans',
      (await recordAttendance({
        checkpointId: gate.id,
        raw: badgeToken(other.id),
        method: 'QR',
        recordedById: admin.id,
      })).status,
      'closed',
    );
  }

  check(
    'a checkpoint that no longer exists refuses too',
    (await recordAttendance({
      checkpointId: 'ckcheckpoint000000000000',
      raw: badgeToken(scanned.id),
      method: 'QR',
      recordedById: admin.id,
    })).status,
    'no-checkpoint',
  );

  // Cascades the one attendance row with it.
  await prisma.checkpoint.delete({ where: { id: gate.id } });
  await prisma.notification.deleteMany({ where: { title: { contains: '[check] gate' } } });
  check('attendance test rows removed', await prisma.checkpoint.count({ where: { nameAr: { startsWith: '[check] ' } } }), 0);
}

// --- undo --------------------------------------------------------------------

await prisma.notification.deleteMany({ where: { title: marker } });
await prisma.announcement.deleteMany({ where: { title: marker } });
check('test data removed', await prisma.notification.count(), before);

await prisma.$disconnect();
console.log(failures === 0 ? '\nall checks passed' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
