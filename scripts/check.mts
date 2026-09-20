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
const { csvCell, toCsv, csvResponse } = await import('../lib/csv');
const { inPages } = await import('../lib/export-pages');
const { checkUpload, MAX_UPLOAD_BYTES } = await import('../lib/blob');
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
const { parseUserFilters, userWhere, userFiltersToQuery } = await import('../lib/admin-users');
const {
  parseRegistrationFilters, registrationWhere, registrationOrderBy,
} = await import('../lib/admin-registrations');
const { parsePage, pageCountFor, listHref } = await import('../lib/admin-list');
const { MAX_SUBMISSIONS_PER_ATTENDEE } = await import('../lib/categories');
const {
  requestPasswordReset, checkResetToken, completePasswordReset, isTokenShape, resetLink,
} = await import('../lib/password-reset');
const { emailConfigured } = await import('../lib/email');
const { RESET_BY_IP, recordFailure, throttleState, clearFailures } = await import(
  '../lib/rate-limit'
);
const { auditServerActions } = await import('../lib/guard-audit');
const { reconcileRegistrationAccount } = await import('../lib/registration-accounts');

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

// --- CSV exports, which an organiser opens in Excel --------------------------

// Every string in an export came from a public registration form, so a cell a
// spreadsheet would execute is somebody else's code running on the organiser's
// machine.
check('a formula is neutralised', csvCell('=HYPERLINK("http://e.example","x")').startsWith('"\'='), true);
check('the DDE form is neutralised', csvCell("=cmd|'/c calc'!A1"), "'=cmd|'/c calc'!A1");
check('a leading plus is neutralised', csvCell('+1+1'), "'+1+1");
check('a leading minus is neutralised', csvCell('-1+1'), "'-1+1");
check('a leading at is neutralised', csvCell('@SUM(1)'), "'@SUM(1)");
check('a leading tab is neutralised', csvCell('\tx'), "'\tx");
check('an ordinary Arabic name is untouched', csvCell('ريم الشرعبي'), 'ريم الشرعبي');
check('an ordinary number is untouched', csvCell(42), '42');
check('a negative number is treated as text, not arithmetic', csvCell(-5), "'-5");
check('commas are still quoted', csvCell('صنعاء, اليمن'), '"صنعاء, اليمن"');
check('embedded quotes are still doubled', csvCell('a "b" c'), '"a ""b"" c"');
check('the file still opens as UTF-8 in Excel', toCsv(['أ'], [['ب']]).startsWith('﻿'), true);
check('rows still end CRLF', toCsv(['أ'], [['ب']]).includes('\r\n'), true);

// --- uploads, one of which any signed-in participant can reach ---------------

const fakeFile = (size: number, type: string) =>
  ({ size, type, name: 'x' }) as unknown as File;

check('a normal photo is accepted', checkUpload(fakeFile(900_000, 'image/jpeg')), null);
check('png is accepted', checkUpload(fakeFile(1000, 'image/png')), null);
check('an empty file is refused', checkUpload(fakeFile(0, 'image/png')) !== null, true);
check('a file over the ceiling is refused', checkUpload(fakeFile(MAX_UPLOAD_BYTES + 1, 'image/png')) !== null, true);
check('a file exactly at the ceiling is accepted', checkUpload(fakeFile(MAX_UPLOAD_BYTES, 'image/png')), null);
check('SVG is refused — it can carry script', checkUpload(fakeFile(500, 'image/svg+xml')) !== null, true);
check('HTML is refused', checkUpload(fakeFile(500, 'text/html')) !== null, true);
check('a PDF is refused', checkUpload(fakeFile(500, 'application/pdf')) !== null, true);
check('an unknown type is refused', checkUpload(fakeFile(500, '')) !== null, true);

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

// --- the filters behind the user directory and its CSV export ----------------
//
// The export re-parses the page's own query string through these, so a
// disagreement here is an export that silently contains people the admin was
// not looking at.

check('an unknown role is ignored rather than queried', parseUserFilters({ role: 'DROP' }).role, '');
check('a lowercase role still filters', parseUserFilters({ role: 'admin' }).role, 'ADMIN');
check('an unknown category is ignored', parseUserFilters({ category: 'vip' }).category, '');
check('"no category" is a real filter', parseUserFilters({ category: 'none' }).category, 'none');
check('an unknown sort falls back to the default', parseUserFilters({ sort: 'salary' }).sort, 'recent');
check('page zero is page one', parseUserFilters({ page: '0' }).page, 1);
check('a nonsense page is page one', parseUserFilters({ page: 'abc' }).page, 1);
check('an absurd page number is clamped', parseUserFilters({ page: '999999999' }).page, 10000);
check('no filters means no where-clause', userWhere(parseUserFilters({})), {});
check(
  '"absent" is a none-relation, not a negation',
  userWhere(parseUserFilters({ attendance: 'absent' })),
  { AND: [{ attendance: { none: {} } }] },
);
check(
  'the export link carries the same filters the page used',
  userFiltersToQuery(parseUserFilters({ q: 'ali', role: 'ADMIN', attendance: 'present' })),
  '?q=ali&role=ADMIN&attendance=present',
);

// --- paging and the registration filters -------------------------------------
//
// Same reason as the user filters above: the registrations CSV re-parses the
// page's own query string through these, so a disagreement here is an export
// containing people the admin was not looking at.

check('page zero is page one', parsePage('0'), 1);
check('a negative page is page one', parsePage('-3'), 1);
check('a nonsense page is page one', parsePage('abc'), 1);
check('a missing page is page one', parsePage(undefined), 1);
check('an absurd page is clamped, not an enormous OFFSET', parsePage('999999999'), 10000);

check('an empty list still has one page', pageCountFor(0), 1);
check('a part-full page still counts', pageCountFor(26), 2);
check('an exact multiple does not gain an empty page', pageCountFor(50), 2);

check('page one is left implicit in a link', listHref('/admin/x', { page: 1 }), '/admin/x');
check('empty filters are dropped from a link', listHref('/admin/x', { q: '', status: undefined }), '/admin/x');
check('applied filters survive into the link', listHref('/admin/x', { q: 'ali', page: 3 }), '/admin/x?q=ali&page=3');

check('an unknown registration sort falls back to the default', parseRegistrationFilters({ sort: 'salary' }).sort, 'recent');
check('a known sort is kept', parseRegistrationFilters({ sort: 'name' }).sort, 'name');
check('the default order is newest first', registrationOrderBy('recent'), [{ submittedAt: 'desc' }]);
check('oldest-first really reverses it', registrationOrderBy('oldest'), [{ submittedAt: 'asc' }]);
check('an unknown registration category is ignored', parseRegistrationFilters({ category: 'vip' }).category, '');
check('a known one filters', parseRegistrationFilters({ category: 'volunteer' }).category, 'volunteer');
check('an unknown linked value is ignored', parseRegistrationFilters({ linked: 'maybe' }).linked, '');
check('no filters means no where-clause', registrationWhere(parseRegistrationFilters({})), {});
check(
  '"no account" is a null check, not a negation',
  registrationWhere(parseRegistrationFilters({ linked: 'no' })),
  { AND: [{ userId: null }] },
);

// --- the ceiling on what one attendee may submit -----------------------------
//
// createSubmission is a public POST endpoint that uploads a cover image to
// Blob storage before it writes anything, so an absent ceiling is an unmetered
// way to spend the conference's storage budget and bury the review committee.

check('a ceiling on submissions exists at all', Number.isInteger(MAX_SUBMISSIONS_PER_ATTENDEE), true);
check('and it is a real limit, not a formality', MAX_SUBMISSIONS_PER_ATTENDEE > 0 && MAX_SUBMISSIONS_PER_ATTENDEE <= 25, true);

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

// --- losing your password, and getting back in -------------------------------
//
// Security-critical and entirely invisible from the outside: every failure
// mode here either locks a real person out or lets somebody else in.

check('a reset request is capped at three a window', lockSeconds(3, RESET_BY_IP), 60);
check('two requests cost nothing', lockSeconds(2, RESET_BY_IP), 0);

check('a 43-char base64url token is the right shape', isTokenShape('a'.repeat(43)), true);
check('a short token is not', isTokenShape('abc'), false);
check('a token with padding is not', isTokenShape('a'.repeat(42) + '='), false);
check('an empty token is not', isTokenShape(''), false);
check('the link carries the token as a query parameter', resetLink('abc').includes('/reset-password?token=abc'), true);

check('a garbage token is refused without a lookup', (await checkResetToken('nonsense')).valid, false);
check('an empty token is refused', (await checkResetToken('')).valid, false);

const resetSubject = await prisma.user.findFirst({
  where: { role: 'ATTENDEE' },
  select: { id: true, email: true, passwordHash: true, passwordChangedAt: true },
});

if (resetSubject) {
  // requestPasswordReset does not hand back the token — it goes to an inbox.
  // The row it writes holds only a hash, so the check reads the token the same
  // way an attacker with database access would have to: it cannot.
  await prisma.passwordResetToken.deleteMany({ where: { userId: resetSubject.id } });
  await requestPasswordReset(resetSubject.email);

  const issued = await prisma.passwordResetToken.findMany({ where: { userId: resetSubject.id } });
  check('a request issues exactly one token', issued.length, 1);
  check('and stores a hash, never the token itself', /^[0-9a-f]{64}$/.test(issued[0]?.tokenHash ?? ''), true);
  check('which expires within the hour', issued[0].expiresAt.getTime() - Date.now() <= 3_600_000, true);
  check('and is not yet spent', issued[0].usedAt, null);

  // A second request abandons the first, so a mailbox never holds two live
  // links into one account.
  await requestPasswordReset(resetSubject.email);
  check('a second request replaces the first', await prisma.passwordResetToken.count({ where: { userId: resetSubject.id } }), 1);

  // An unknown address must do nothing at all — and, crucially, must not throw,
  // since a different code path is something a caller could time.
  await requestPasswordReset('nobody-at-all@example.invalid');
  check('an unknown address issues nothing', await prisma.passwordResetToken.count({ where: { user: { email: 'nobody-at-all@example.invalid' } } }), 0);

  // Drive the rest through a token forged the way the real one is made, so the
  // spend/expire behaviour is exercised end to end.
  const { createHash, randomBytes } = await import('node:crypto');
  const mint = async (overrides: { expiresAt?: Date; usedAt?: Date } = {}) => {
    const token = randomBytes(32).toString('base64url');
    await prisma.passwordResetToken.deleteMany({ where: { userId: resetSubject.id } });
    await prisma.passwordResetToken.create({
      data: {
        userId: resetSubject.id,
        tokenHash: createHash('sha256').update(token).digest('hex'),
        expiresAt: overrides.expiresAt ?? new Date(Date.now() + 3_600_000),
        usedAt: overrides.usedAt ?? null,
      },
    });
    return token;
  };

  const expired = await mint({ expiresAt: new Date(Date.now() - 1000) });
  check('an expired token is refused', (await checkResetToken(expired)).valid, false);

  const spent = await mint({ usedAt: new Date() });
  check('an already-used token is refused', (await checkResetToken(spent)).valid, false);

  const live = await mint();
  const liveState = await checkResetToken(live);
  // Narrowed rather than read straight off the union: `userId` only exists on
  // the valid branch, which is the point of modelling it that way.
  check('a fresh token resolves to its account', liveState.valid && liveState.userId, resetSubject.id);
  check('a short password is refused', (await completePasswordReset(live, 'short')).status, 'weak-password');
  check('and refusing it did not spend the token', (await checkResetToken(live)).valid, true);

  // Lock the account first, the way five wrong guesses would. Somebody who has
  // forgotten their password has usually guessed at it several times before
  // reaching for the reset link, so this is the ordinary case, not a corner.
  for (let i = 0; i < LOGIN_BY_EMAIL.limit + 1; i++) {
    await recordFailure('login:email', resetSubject.email, LOGIN_BY_EMAIL);
  }
  check('wrong guesses lock the account', (await throttleState('login:email', resetSubject.email)).blocked, true);

  check('a good password is accepted', (await completePasswordReset(live, 'a-long-enough-password')).status, 'ok');
  check('the token is spent immediately after', (await checkResetToken(live)).valid, false);
  check('and cannot be replayed', (await completePasswordReset(live, 'another-long-password')).status, 'invalid-token');

  const changed = await prisma.user.findUnique({
    where: { id: resetSubject.id },
    select: { passwordHash: true, passwordChangedAt: true },
  });
  check('the password really changed', changed?.passwordHash !== resetSubject.passwordHash, true);

  // The two things a reset has to do beyond setting a password.

  // Sessions are JWTs with no server-side store, so there is nothing to delete
  // to sign somebody out. This stamp is the whole mechanism: lib/auth-guards.ts
  // refuses any token minted before it. Without it a reset leaves whoever
  // prompted it signed in for the full 30-day life of their cookie — which is
  // the one thing a reset exists to stop.
  const stampedAt = changed?.passwordChangedAt?.getTime() ?? 0;
  check('it stamps passwordChangedAt', stampedAt > (resetSubject.passwordChangedAt?.getTime() ?? 0), true);
  check('and stamps it to now, not some later date', stampedAt <= Date.now(), true);

  // Otherwise recovery fails at exactly the moment it is needed: the person has
  // just proved they own the address, and would still be told to wait fifteen
  // minutes because of the failed guesses that sent them to the reset form.
  check('it frees the login lock', (await throttleState('login:email', resetSubject.email)).blocked, false);

  // Put the account back exactly as it was — this runs against the real
  // database, and the person it belongs to must still be able to sign in.
  // passwordChangedAt is restored too: leaving the stamp advanced would sign
  // them out of a live session merely because the checks were run.
  await prisma.user.update({
    where: { id: resetSubject.id },
    data: {
      passwordHash: resetSubject.passwordHash,
      passwordChangedAt: resetSubject.passwordChangedAt,
    },
  });
  await prisma.passwordResetToken.deleteMany({ where: { userId: resetSubject.id } });
  await clearFailures('login:email', resetSubject.email);

  const restored = await prisma.user.findUnique({
    where: { id: resetSubject.id },
    select: { passwordHash: true, passwordChangedAt: true },
  });
  check('the original password hash is restored', restored?.passwordHash, resetSubject.passwordHash);
  check(
    'and the stamp with it, so nobody is signed out by the checks',
    restored?.passwordChangedAt?.getTime() ?? null,
    resetSubject.passwordChangedAt?.getTime() ?? null,
  );
  check('and no reset tokens are left behind', await prisma.passwordResetToken.count({ where: { userId: resetSubject.id } }), 0);
  check('and the account is not left locked out', (await throttleState('login:email', resetSubject.email)).blocked, false);
}

// The admin sign-in now offers a recovery link, which is only honest if the
// flow does not quietly filter by role. It does not — but that is the kind of
// thing a later "admins are special" clause would break silently, and the
// person locked out would be the only one who could have fixed it.
const tempAdmin = await prisma.user.create({
  data: {
    email: 'reset-admin-check@regcheck.invalid',
    passwordHash: 'x',
    name: 'Reset Check',
    role: 'ADMIN',
    category: 'visitor',
  },
});
await requestPasswordReset('reset-admin-check@regcheck.invalid');
check(
  'an admin can be sent a reset link too, not just attendees',
  await prisma.passwordResetToken.count({ where: { userId: tempAdmin.id } }),
  1,
);
await prisma.user.delete({ where: { id: tempAdmin.id } });
check(
  'and its token goes with the account',
  await prisma.passwordResetToken.count({ where: { userId: tempAdmin.id } }),
  0,
);

// Reported, not asserted: mail being switched off is a valid configuration,
// and the reset flow is built to behave identically either way.
console.log(`  (email ${emailConfigured() ? 'is configured' : 'is NOT configured — reset links will not be delivered'})`);

// --- every server action checks who is calling it ----------------------------
//
// Structural, and the most valuable check in this file: a missing guard is
// invisible in the panel — the feature works perfectly for the admin using it
// — and means a stranger can call the action directly. Nine modules were in
// exactly that state, including the one that deletes registrations.

const audit = auditServerActions('app');
for (const { file, action } of audit.unguarded) {
  console.log(`    unguarded: ${file} :: ${action}`);
}
check('every exported server action checks its caller', audit.unguarded.length, 0);

// Reported, not asserted. These are public on purpose — you are by definition
// signed out when you ask for a password-reset link — and the point of listing
// them is that the list stays short and stays read.
console.log(
  `  (${audit.total} server actions; ${audit.declaredPublic.length} declared public: ` +
    `${audit.declaredPublic.map((a) => a.action).join(', ') || 'none'})`,
);

// --- giving a registration an account -----------------------------------------
//
// The action behind the "بلا حساب" filter. Checked here rather than through
// the action, because an action is only reachable by guessing Next.js's
// internal id for it — which, when attempted, identified the wrong one and
// deleted the row under test.

const RMARK = '[regcheck]';
await prisma.registration.deleteMany({ where: { fullName: { startsWith: RMARK } } });
await prisma.user.deleteMany({ where: { email: { endsWith: '@regcheck.invalid' } } });

// 1. A registration with no account anywhere -> an account is created.
const orphan = await prisma.registration.create({
  data: {
    fullName: `${RMARK} بلا حساب`,
    email: 'orphan@regcheck.invalid',
    category: 'participant',
    phone: '555',
    country: 'تركيا',
    track: 'البحث العلمي',
  },
});

const madeAccount = await reconcileRegistrationAccount(orphan.id);
check('a registration with no account gets one', madeAccount.status, 'created');
check('and the password comes back exactly once', madeAccount.status === 'created' && madeAccount.password.length, 16);

const madeUser = await prisma.user.findUnique({
  where: { email: 'orphan@regcheck.invalid' },
  select: { id: true, name: true, phone: true, country: true, track: true, category: true, confirmationCode: true, role: true },
});
check('the account carries the registration\'s own details', [madeUser?.name, madeUser?.phone, madeUser?.country, madeUser?.track], [`${RMARK} بلا حساب`, '555', 'تركيا', 'البحث العلمي']);
check('the tier is taken from the registration', madeUser?.category, 'participant');
check('and it is an attendee, never an admin', madeUser?.role, 'ATTENDEE');
check('it gets a badge code, so it can be scanned', /^CICT-2026-[A-Z0-9]{6}$/.test(madeUser?.confirmationCode ?? ''), true);

const linkedBack = await prisma.registration.findUnique({ where: { id: orphan.id }, select: { userId: true } });
check('the registration is attached in the same breath', linkedBack?.userId, madeUser?.id);
check('so it no longer counts as needing an account', await prisma.registration.count({ where: { id: orphan.id, userId: null } }), 0);

// 2. Doing it twice must not make a second account.
check('a second attempt is refused', (await reconcileRegistrationAccount(orphan.id)).status, 'already-linked');
check('and no duplicate account exists', await prisma.user.count({ where: { email: 'orphan@regcheck.invalid' } }), 1);

// 3. A registration whose address ALREADY has an account -> link, never create.
//    This is the case that quietly turns one person into two.
const second = await prisma.registration.create({
  data: { fullName: `${RMARK} نسخة ثانية`, email: 'orphan@regcheck.invalid', category: 'visitor' },
});
const relinked = await reconcileRegistrationAccount(second.id);
check('an address that already has an account is linked, not duplicated', relinked.status, 'linked');
check('it points at the existing account', relinked.status === 'linked' && relinked.userId, madeUser?.id);
check('and still exactly one account holds that address', await prisma.user.count({ where: { email: 'orphan@regcheck.invalid' } }), 1);

// 4. A registration that does not exist.
check('a missing registration is reported, not thrown', (await reconcileRegistrationAccount('ckdoesnotexist000000000')).status, 'not-found');

await prisma.registration.deleteMany({ where: { fullName: { startsWith: RMARK } } });
await prisma.user.deleteMany({ where: { email: { endsWith: '@regcheck.invalid' } } });
check('registration test rows removed', await prisma.registration.count({ where: { fullName: { startsWith: RMARK } } }), 0);
check('and their accounts too', await prisma.user.count({ where: { email: { endsWith: '@regcheck.invalid' } } }), 0);

// --- exports that stream ------------------------------------------------------

// The exports used to build the whole file in memory, which cost about 1.45 KB
// per account — 729 MB at half a million, inside a function limited to 1 GB.
// They now write a page at a time. The refactor is only safe if the bytes are
// the same however the rows happen to fall into pages.
{
  const header = ['الاسم', 'الرمز'];
  const rows: (string | number | null)[][] = [
    ['ريم الشرعبي', 'A1'],
    ['=cmd|calc', 'B2'],        // still has to be neutralised
    ['صنعاء, اليمن', null],     // still has to be quoted
  ];

  // Compared as bytes, not as text. `Response.text()` strips a leading BOM as
  // it decodes, which would hide the one byte Excel depends on to read the
  // file as UTF-8 — the check would pass while the Arabic arrived as mojibake.
  const bytes = async (pages: (string | number | null)[][][]) =>
    Array.from(
      new Uint8Array(
        await csvResponse('t.csv', header, (async function* () {
          for (const page of pages) yield page;
        })()).arrayBuffer(),
      ),
    ).join(',');
  const expected = (r: (string | number | null)[][]) =>
    Array.from(new TextEncoder().encode(toCsv(header, r))).join(',');

  check('one page matches building it all at once', await bytes([rows]), expected(rows));
  check('and so do three pages of one row', await bytes([[rows[0]], [rows[1]], [rows[2]]]), expected(rows));
  check('and an uneven split', await bytes([[rows[0], rows[1]], [rows[2]]]), expected(rows));
  // An export whose filter matched nobody must still be a file that opens,
  // with its header, rather than zero bytes that look like a failed download.
  check('an empty export is still a valid file', await bytes([]), expected([]));
  check('empty pages in the middle change nothing', await bytes([[rows[0]], [], [rows[1], rows[2]]]), expected(rows));
  check(
    'the byte-order mark really is the first byte',
    (await bytes([rows])).startsWith('239,187,191'),
    true,
  );

  const resp = csvResponse('cict-users.csv', header, (async function* () {})());
  check('it is sent as a download', resp.headers.get('content-disposition'), 'attachment; filename="cict-users.csv"');
  check('personal data is never cached', resp.headers.get('cache-control'), 'no-store');
  check('and declared UTF-8, or Excel mangles the Arabic', resp.headers.get('content-type'), 'text/csv; charset=utf-8');
}

// Paging itself: the failure that matters is a row silently missing from an
// export, which nobody would notice until the list was used for something.
{
  const all = Array.from({ length: 250 }, (_unused, i) => ({ id: `id-${String(i).padStart(4, '0')}` }));

  const drain = async (pageSize: number, source = all) => {
    const seen: string[] = [];
    let queries = 0;
    for await (const page of inPages(async (after, take) => {
      queries++;
      const start = after ? source.findIndex((r) => r.id === after) + 1 : 0;
      return source.slice(start, start + take);
    }, pageSize)) {
      seen.push(...page.map((r) => r.id));
    }
    return { seen, queries };
  };

  const a = await drain(100);
  check('every row comes back', a.seen.length, 250);
  check('in order, none repeated, none skipped', a.seen.join(','), all.map((r) => r.id).join(','));
  check('a short final page ends it without another query', a.queries, 3);

  // The boundary case: a table whose size is an exact multiple of the page.
  // Here the last full page looks like there may be more, so one extra query
  // is correct — what would be wrong is stopping early and losing rows.
  const b = await drain(125);
  check('an exact multiple still returns everything', b.seen.length, 250);
  check('and costs one empty query to learn it is done', b.queries, 3);

  const c = await drain(1000);
  check('a page larger than the table is one query', c.queries, 1);
  check('and still returns everything', c.seen.length, 250);

  const d = await drain(100, []);
  check('an empty table yields nothing', d.seen.length, 0);
  check('and asks exactly once', d.queries, 1);
}

// --- undo --------------------------------------------------------------------

await prisma.notification.deleteMany({ where: { title: marker } });
await prisma.announcement.deleteMany({ where: { title: marker } });
check('test data removed', await prisma.notification.count(), before);

await prisma.$disconnect();
console.log(failures === 0 ? '\nall checks passed' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
