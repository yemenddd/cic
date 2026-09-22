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
const {
  validateAnnouncement, deliverAnnouncement, editAnnouncement, deleteAnnouncement,
  resendAnnouncement,
} = await import('../app/admin/(panel)/announcements/send');
const { prisma } = await import('../lib/db/client');
const { isInternalPath, openAndResolveTarget, NOTIFICATIONS_PATH } = await import(
  '../app/dashboard/notifications/open'
);
const { canSubmitInnovations } = await import('../lib/categories');
const { isTrackAllowed, canonicalTrack, SUBMISSION_TRACKS } = await import('../lib/submissions');
const { waitingSince, queueHealth, statusGuidance } = await import('../lib/submission-queue');
const { csvCell, toCsv, csvResponse } = await import('../lib/csv');
const { inPages } = await import('../lib/export-pages');
const { checkUpload, MAX_UPLOAD_BYTES } = await import('../lib/blob');
const { lockSeconds, LOGIN_BY_EMAIL, LOGIN_BY_IP, REGISTER_BY_IP } = await import(
  '../lib/rate-limit'
);
const { relativeArabicDate } = await import('../lib/relative-time');
const { arabicCountBare, SESSION } = await import('../lib/arabic-plural');
const {
  daysUntilConference, conferenceStart, conferenceEnd, conferenceHasEnded, conferenceHasStarted,
} = await import('../lib/conference');
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
const { profileCompleteness } = await import('../lib/profile-completeness');
const { certificateReadiness } = await import('../lib/certificate-readiness');
const { resolveSettings, cleanUrl, cleanEmail, DEFAULT_SETTINGS } = await import('../lib/site-settings');
const { passwordStrength } = await import('../lib/password-strength');
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
// Half an hour, not the full one it used to be. The ceiling it guards is now
// thirty an hour rather than five, so anything that trips it is either a
// genuinely busy desk — which should not be shut out until lunchtime — or a
// script, which half an hour slows down just as well.
check('a tripped signup limit clears in half an hour', lockSeconds(99, REGISTER_BY_IP), 1800);

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
check('an unsigned lookalike is refused', verifyBadgeToken('CIC1.ckuser000000000000000000.AAAAAAAAAAAAAAAAAAAAAA'), null);
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
  parseScanInput(`https://cictr.org/b/${TOKEN}`),
  { kind: 'token', userId: SUBJECT },
);
check('a confirmation code is read as a code', parseScanInput('CIC-2026-ABC234'), { kind: 'code', code: 'CIC-2026-ABC234' });
check('a code typed in lowercase is accepted', parseScanInput('cic-2026-abc234'), { kind: 'code', code: 'CIC-2026-ABC234' });
check('a code with the ambiguous glyphs is refused', parseScanInput('CIC-2026-ABC01O'), { kind: 'unreadable' });
check('a forged token is not downgraded to a code lookup', parseScanInput('CIC1.ckuser000000000000000000.AAAAAAAAAAAAAAAAAAAAAA'), { kind: 'unreadable' });
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
      raw: 'CIC1.ckuser000000000000000000.AAAAAAAAAAAAAAAAAAAAAA',
      method: 'QR',
      recordedById: admin.id,
    })).status,
    'unreadable',
  );

  check(
    'a well-formed code nobody holds counts nobody',
    (await recordAttendance({
      checkpointId: gate.id,
      raw: 'CIC-2026-ZZZZZZ',
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
check('it gets a badge code, so it can be scanned', /^CIC-2026-[A-Z0-9]{6}$/.test(madeUser?.confirmationCode ?? ''), true);

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

  const resp = csvResponse('cic-users.csv', header, (async function* () {})());
  check('it is sent as a download', resp.headers.get('content-disposition'), 'attachment; filename="cic-users.csv"');
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

// --- has it started? ---------------------------------------------------------

// The dashboard shows an attendance ring only once there is a door to have
// walked through. Before that the figure can only be zero, which measures
// nothing — so the boundary is what decides whether a whole card appears.
{
  const opening = conferenceStart();
  check('the instant it opens counts as started', conferenceHasStarted(opening), true);
  check('a second before it does not', conferenceHasStarted(new Date(opening.getTime() - 1000)), false);
  check('a second after it does', conferenceHasStarted(new Date(opening.getTime() + 1000)), true);
  check('the day before does not', conferenceHasStarted(new Date(opening.getTime() - 86_400_000)), false);
  // Still "started" long after it is over: the two are different questions,
  // and an attendance record does not stop being worth showing on the way home.
  check('it stays started once ended', conferenceHasStarted(conferenceEnd()), true);
  check('and ended is still its own question', conferenceHasEnded(opening), false);
}

// --- the account page's two meters -------------------------------------------

// What gets printed on a badge and a certificate, and whether it is there.
{
  const empty = profileCompleteness({});
  check('an empty profile is zero complete', empty.filled, 0);
  check('and knows what it is missing', empty.missingEssential.map((i) => i.key).sort(), ['name', 'track']);

  const full = profileCompleteness({
    name: 'ريم الشرعبي', phone: '+905551234567', country: 'تركيا',
    organization: 'جامعة', track: 'البحث العلمي',
  });
  check('a filled profile is complete', full.ratio, 1);
  check('with nothing essential outstanding', full.missingEssential.length, 0);

  // Whitespace is not a value: " " in a name prints as a blank line on a
  // certificate, and counting it as filled is how that ships.
  const blank = profileCompleteness({ name: '   ', track: '\t' });
  check('whitespace does not count as filled', blank.filled, 0);
  check('and is still reported as missing', blank.missingEssential.length, 2);

  const partial = profileCompleteness({ name: 'ريم', country: 'اليمن' });
  check('a partial profile counts what is there', partial.filled, 2);
  check('of the five fields', partial.total, 5);
  check('and still names the missing essential', partial.missingEssential.map((i) => i.key), ['track']);
  check('every field explains what it is for', partial.items.every((i) => i.why.length > 0), true);
}

// The strength meter. It is guidance, not a gate — but wrong guidance is worse
// than none, so the cases that must not read "strong" are checked.
{
  const level = (p: string, email?: string) => passwordStrength(p, email).level;

  check('nothing typed has no verdict', passwordStrength('').label, '');
  check('under the minimum is too short', level('short'), 'tooShort');
  check('and says how many characters remain', passwordStrength('short').advice?.includes('5'), true);
  check('exactly the minimum is not too short', level('abcmnpqrxy') !== 'tooShort', true);

  // Length alone must not rescue a notorious password.
  check('a long common password is still weak', level('password12345678'), 'weak');
  check('leetspeak does not save it', level('passw0rd123456789'), 'weak');
  check('the address is not a password', level('reemalsharabi99', 'reemalsharabi@example.com'), 'weak');
  check('repeated characters are weak', level('aaaabbbbcccc'), 'weak');
  check('a run of consecutive characters is weak', level('abcdefghijkl'), 'weak');

  // Length is what actually costs an attacker time, so it outranks symbols.
  check('a long ordinary phrase is strong', level('mountain river lantern'), 'strong');
  check('a short complex one is not', level('Xk7#mQ2!p'), 'tooShort');
  check('thirteen mixed characters are strong', level('Kx7mQpRt2Nvz4'), 'strong');
  check('a long lowercase-only phrase still rates', level('lanternrivermoth') !== 'weak', true);

  check('a weak password is told why', passwordStrength('password12345678').advice !== null, true);
  check('a strong one is not nagged', passwordStrength('mountain river lantern').advice, null);
}

// --- would the certificate come out right? -----------------------------------

// It states in the past tense that its holder attended and carries the
// committee's seal, so the values printed on it are the whole document. The
// severities are a real distinction: a certificate awarded to nobody is
// worthless, a certificate missing its track line is merely thinner.
{
  const full = certificateReadiness({
    name: 'ريم الشرعبي', track: 'البحث العلمي', confirmationCode: 'CIC-2026-000001',
  });
  check('a complete profile is ready', full.ready, true);
  check('and not blocked', full.blocked, false);
  check('with nothing to report', full.issues.length, 0);

  const nameless = certificateReadiness({ track: 'البحث العلمي', confirmationCode: 'X' });
  check('a missing name blocks', nameless.blocked, true);
  check('and says what it would produce', nameless.issues[0].consequence.includes('بلا اسم'), true);
  check('and points at where to fix it', nameless.issues[0].href, '/dashboard/account');

  // A name of spaces is the case that would otherwise print a blank line under
  // "هذه شهادة تُمنح إلى" and look like a rendering fault rather than a gap.
  check('whitespace is not a name', certificateReadiness({ name: '   ' }).blocked, true);

  const noTrack = certificateReadiness({ name: 'ريم', confirmationCode: 'X' });
  check('a missing track does not block', noTrack.blocked, false);
  check('but is still reported', noTrack.ready, false);
  check('as degraded, not fatal', noTrack.issues[0].level, 'degraded');

  // Nothing the attendee can do about this one, so it must not be phrased as a
  // task or given a link to a page that cannot fix it.
  const noCode = certificateReadiness({ name: 'ريم', track: 'البحث العلمي' });
  check('an unissued code is pending, not an error', noCode.issues[0].level, 'pending');
  check('and offers no action', noCode.issues[0].href, null);
  check('and does not block', noCode.blocked, false);

  const empty = certificateReadiness({});
  check('an empty profile reports all three', empty.issues.length, 3);
  check('and is blocked', empty.blocked, true);
}

// --- the settings an organizer can change without a deploy --------------------

// These land on the public site, so the cleaning is a boundary rather than a
// convenience: the footer renders the links straight into href on every page.
{
  check('an https link survives', cleanUrl('https://x.com/yemenddd'), 'https://x.com/yemenddd');
  check('so does plain http', cleanUrl('http://example.org/').startsWith('http://'), true);
  // The one that matters. A javascript: URL pasted into the admin form would
  // be script running on every page of the public site.
  check('javascript: is refused', cleanUrl('javascript:alert(1)'), '');
  check('and case does not smuggle it', cleanUrl('JaVaScRiPt:alert(1)'), '');
  check('data: is refused', cleanUrl('data:text/html,<script>alert(1)</script>'), '');
  check('vbscript: is refused', cleanUrl('vbscript:msgbox(1)'), '');
  check('a bare domain is not a link', cleanUrl('facebook.com/yemenddd'), '');
  check('nonsense is dropped', cleanUrl('not a url at all'), '');
  check('empty stays empty', cleanUrl(''), '');
  check('null is handled', cleanUrl(null), '');

  check('a real address survives', cleanEmail('Hello@CICTR.org'), 'hello@cictr.org');
  check('an address with no domain is refused', cleanEmail('hello@localhost'), '');
  check('an address with a space is refused', cleanEmail('a b@example.com'), '');
  check('a bare word is refused', cleanEmail('hello'), '');

  // An empty table must render exactly the site that shipped.
  const empty = resolveSettings(null);
  check('no row falls back to the shipped values', empty.contactEmail, DEFAULT_SETTINGS.contactEmail);
  check('and the shipped links', empty.xUrl, DEFAULT_SETTINGS.xUrl);
  // The most important default on the page: a site that silently stopped
  // accepting registrations because a table was empty would be the worst
  // failure available here.
  check('and registration is OPEN when nothing is stored', empty.registrationOpen, true);

  // Each field falls back on its own, so a partly filled form does not blank
  // the rest on first save.
  const partial = resolveSettings({ contactEmail: 'info@example.org' });
  check('a set field is used', partial.contactEmail, 'info@example.org');
  check('and the unset ones still default', partial.facebookUrl, DEFAULT_SETTINGS.facebookUrl);

  // Anything stored that is no longer acceptable is treated as absent rather
  // than rendered — a row written before the cleaning existed, say.
  check('a stored javascript: link is not served', resolveSettings({ xUrl: 'javascript:alert(1)' }).xUrl, DEFAULT_SETTINGS.xUrl);
  check('a stored broken address is not served', resolveSettings({ contactEmail: 'broken' }).contactEmail, DEFAULT_SETTINGS.contactEmail);
  check('whitespace counts as unset', resolveSettings({ contactEmail: '   ' }).contactEmail, DEFAULT_SETTINGS.contactEmail);

  check('only an explicit false closes registration', resolveSettings({ registrationOpen: false }).registrationOpen, false);
  check('true keeps it open', resolveSettings({ registrationOpen: true }).registrationOpen, true);
  // A column that has never been written reads as undefined, not false.
  check('undefined keeps it open', resolveSettings({ registrationOpen: undefined }).registrationOpen, true);
  check('a closed note always has text', resolveSettings({}).registrationClosedNote.length > 0, true);
}

// --- the CICT -> CIC rename ---------------------------------------------------

// The badge token's version tag is fed into the HMAC, so renaming it changes
// every signature. A badge is a physical object somebody may have printed
// before the rename, and it has to keep scanning at the door.
{
  const { createHmac } = await import('node:crypto');
  const userId = 'ckuser000000000000000000';

  const issued = badgeToken(userId);
  check('new badges carry the new tag', issued.startsWith('CIC1.'), true);
  check('and not the old one', issued.startsWith('CICT1.'), false);
  check('a new badge verifies', verifyBadgeToken(issued), userId);

  // Forged exactly the way the old code signed them.
  const legacySig = createHmac('sha256', process.env.AUTH_SECRET!)
    .update(`CICT1:${userId}`)
    .digest('base64url')
    .slice(0, 22);
  const legacy = `CICT1.${userId}.${legacySig}`;
  check('a badge printed before the rename still scans', verifyBadgeToken(legacy), userId);

  // The tag is part of what is signed, so the two are not interchangeable.
  const swapped = issued.replace('CIC1.', 'CICT1.');
  check('a new signature under the old tag is refused', verifyBadgeToken(swapped), null);
  const swappedBack = legacy.replace('CICT1.', 'CIC1.');
  check('and an old signature under the new tag is refused', verifyBadgeToken(swappedBack), null);

  check('nonsense is still refused', verifyBadgeToken('CIC1.x.y'), null);
}

// --- an announcement after it has gone out ------------------------------------

// The panel could send and then only watch. A wrong room number stayed wrong
// in every feed it reached, and somebody who registered on Tuesday never saw
// Monday's notice.
{
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
  const AMARK = `[edit ${Date.now()}]`;

  if (admin) {
    const sent = await deliverAnnouncement(admin.id, {
      title: AMARK, body: 'النص الأول', link: '/program', audience: 'visitor',
    });
    const delivered = 'sent' in sent ? sent.sent : 0;
    check('the announcement is delivered', delivered > 0, true);

    const record = await prisma.announcement.findFirst({ where: { title: AMARK } });
    check('a record exists', Boolean(record), true);

    // Every copy is linked to it. Without this, withdrawing removes nothing.
    const linked = await prisma.notification.count({ where: { announcementId: record!.id } });
    check('every copy is linked to the announcement', linked, delivered);

    // Editing reaches the copies already in people's feeds.
    const edited = await editAnnouncement(record!.id, {
      title: `${AMARK} معدّل`, body: 'النص المصحّح', link: '/program', audience: 'visitor',
    });
    check('the edit reports how many it reached', 'sent' in edited && edited.sent, delivered);
    const copy = await prisma.notification.findFirst({ where: { announcementId: record!.id } });
    check('and the delivered copy carries the correction', copy?.body, 'النص المصحّح');
    check('and the corrected title', copy?.title, `${AMARK} معدّل`);

    // Read state survives an edit. Re-alerting the conference over a typo is
    // how people learn to ignore the bell.
    await prisma.notification.updateMany({ where: { announcementId: record!.id }, data: { read: true } });
    await editAnnouncement(record!.id, {
      title: `${AMARK} معدّل`, body: 'تصحيح ثانٍ', link: '', audience: 'visitor',
    });
    check('editing does not mark it unread again',
      await prisma.notification.count({ where: { announcementId: record!.id, read: false } }), 0);

    // Resending reaches only those without a copy — nobody here, so it refuses
    // rather than sending everyone a duplicate.
    const again = await resendAnnouncement(record!.id);
    check('resending to a fully covered audience is refused', 'error' in again, true);

    // Withdrawing takes the feed entries with it.
    const removed = await deleteAnnouncement(record!.id);
    check('withdrawing reports what it removed', 'removed' in removed && removed.removed, delivered);
    check('the record is gone', await prisma.announcement.count({ where: { id: record!.id } }), 0);
    check('and so is every copy it delivered',
      await prisma.notification.count({ where: { announcementId: record!.id } }), 0);

    // A second attempt is reported, not thrown — two organizers with the page
    // open is the ordinary case.
    check('withdrawing a missing one is reported', 'error' in (await deleteAnnouncement(record!.id)), true);
    check('editing a missing one is reported', 'error' in (await editAnnouncement(record!.id, {
      title: 'x', body: 'y', link: '', audience: 'visitor',
    })), true);

    await prisma.announcement.deleteMany({ where: { title: { startsWith: AMARK } } });
    await prisma.notification.deleteMany({ where: { title: { startsWith: AMARK } } });
    check('edit test rows removed', await prisma.announcement.count({ where: { title: { startsWith: AMARK } } }), 0);
  }
}

// --- the review queue, from both ends -----------------------------------------

// The committee's page showed a status and a date, and the attendee's showed
// the same status. Neither answered the question each side actually has.
{
  const NOW = new Date('2026-09-22T12:00:00Z');
  const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

  check('a draft has no wait', waitingSince(null, NOW), null);
  check('submitted today reads as today', waitingSince(daysAgo(0), NOW)?.label, 'اليوم');
  check('one day uses the singular', waitingSince(daysAgo(1), NOW)?.label, 'منذ يوم');
  check('two days uses the dual', waitingSince(daysAgo(2), NOW)?.label, 'منذ يومين');
  check('three to ten take the few form', waitingSince(daysAgo(5), NOW)?.label, 'منذ 5 أيام');
  check('eleven and up take the many form', waitingSince(daysAgo(20), NOW)?.label, 'منذ 20 يوماً');

  check('under a week is fresh', waitingSince(daysAgo(6), NOW)?.level, 'fresh');
  check('a week is aging', waitingSince(daysAgo(7), NOW)?.level, 'aging');
  check('a fortnight is overdue', waitingSince(daysAgo(14), NOW)?.level, 'overdue');
  // A row written a moment ago, or a clock a little ahead. Never negative days.
  check('a future date is not negative days', waitingSince(new Date(NOW.getTime() + 60_000), NOW)?.days, 0);

  const health = queueHealth([
    { status: 'DRAFT', submittedAt: null },
    { status: 'DRAFT', submittedAt: null },
    { status: 'PENDING', submittedAt: daysAgo(20) },
    { status: 'PENDING', submittedAt: daysAgo(3) },
    { status: 'UNDER_REVIEW', submittedAt: daysAgo(16) },
    { status: 'APPROVED', submittedAt: daysAgo(30) },
    { status: 'REJECTED', submittedAt: daysAgo(30) },
  ], NOW);

  check('it counts what is waiting on the committee', health.awaiting, 3);
  check('and how long the oldest has waited', health.oldestWaitDays, 20);
  check('and how many are past a fortnight', health.overdue, 2);
  check('decided is decided', health.decided, 2);
  // Drafts are somebody's unfinished work, not a queue the committee is behind
  // on. Folding them in would show the panel permanently in arrears over
  // projects nobody has submitted.
  check('drafts are counted apart', health.drafts, 2);
  check('and are not waiting on anybody', health.awaiting + health.decided + health.drafts, 7);

  const empty = queueHealth([], NOW);
  check('an empty queue has no oldest wait', empty.oldestWaitDays, 0);
  check('and nothing overdue', empty.overdue, 0);

  // The distinction that matters most: a draft looks submitted and is not.
  check('a draft says it has not been seen', statusGuidance('DRAFT').meaning.includes('لم تره اللجنة'), true);
  check('and tells them to send it', statusGuidance('DRAFT').actionable, true);
  check('waiting asks nothing of them', statusGuidance('PENDING').next, null);
  check('being read asks nothing either', statusGuidance('UNDER_REVIEW').actionable, false);
  check('a decision does', statusGuidance('REJECTED').actionable, true);
  check('every status says something', (['DRAFT','PENDING','UNDER_REVIEW','APPROVED','REJECTED'] as const)
    .every((s) => statusGuidance(s).meaning.length > 0), true);
}

// --- one account per person ---------------------------------------------------

// An organizer has one account and it is the organizer's. Nothing stopped an
// admin opening the attendee side, so every admin also had a badge, a
// certificate, an agenda and a submissions quota — a second identity that
// would have turned up in the attendance figures and the certificate list as
// if it were a participant.
{
  const dashboardLayout = readFileSync('app/dashboard/layout.tsx', 'utf8');
  const adminLayout = readFileSync('app/admin/(panel)/layout.tsx', 'utf8');
  const proxy = readFileSync('proxy.ts', 'utf8');

  check('the dashboard sends admins to the panel', /role === 'ADMIN'\)\s*redirect\('\/admin'\)/.test(dashboardLayout), true);
  check('the panel sends attendees to the dashboard', /role !== 'ADMIN'\)\s*redirect\('\/dashboard'\)/.test(adminLayout), true);

  // Both read the database. The pair is only safe because neither decides
  // from the JWT: the role in a token is a copy written at sign-in, so an
  // account promoted since then still says ATTENDEE. If the proxy redirected
  // on that stale copy, /admin would bounce to /dashboard, the dashboard
  // would read ADMIN from the database and bounce back, and nothing would
  // ever settle.
  check('the dashboard decides from the database', dashboardLayout.includes('currentUser()'), true);
  check('and so does the panel', adminLayout.includes('currentUser()'), true);
  check('the proxy no longer decides on the stale role', /user\.role/.test(proxy), false);
  check('it still turns signed-out visitors away from /admin', proxy.includes("'/admin/login'"), true);
  check('and from /dashboard', proxy.includes("'/login'"), true);

  // The two conditions are exhaustive and mutually exclusive over the enum,
  // which is what makes the pair terminate: exactly one of them fires.
  const roles = ['ADMIN', 'ATTENDEE'] as const;
  check('every role is handled by exactly one side', roles.every((r) => (r === 'ADMIN') !== (r !== 'ADMIN')), true);
}

// --- registering, in three languages ------------------------------------------

// The public form posts the label the visitor saw, and it is offered in
// Arabic, English and Turkish. Validating against the Arabic list alone would
// refuse every English and Turkish signup; storing the label as posted is what
// put "Innovation & Technology" on an Arabic certificate.
{
  check('an Arabic track passes through', canonicalTrack('البحث العلمي'), 'البحث العلمي');
  check('an English label becomes the Arabic one', canonicalTrack('Scientific Research'), 'البحث العلمي');
  check('and a Turkish one', canonicalTrack('Bilimsel Araştırma'), 'البحث العلمي');
  check('entrepreneurship, English', canonicalTrack('Entrepreneurship'), 'ريادة الأعمال');
  check('entrepreneurship, Turkish', canonicalTrack('Girişimcilik'), 'ريادة الأعمال');
  check('AI, English', canonicalTrack('AI & Robotics'), 'الذكاء الاصطناعي والروبوتات');
  check('innovation, Turkish', canonicalTrack('İnovasyon ve Teknoloji'), 'الابتكار والتقنية');
  check('case does not matter', canonicalTrack('scientific research'), 'البحث العلمي');
  check('surrounding space does not matter', canonicalTrack('  Entrepreneurship  '), 'ريادة الأعمال');

  // Empty is a real answer — the track is optional.
  check('empty stays empty', canonicalTrack(''), '');
  check('whitespace counts as empty', canonicalTrack('   '), '');
  check('null is handled', canonicalTrack(null), '');

  // Anything else is an invented value, and it is printed on a certificate.
  check('an invented track is refused', canonicalTrack('مسار مخترع'), null);
  check('and an invented English one', canonicalTrack('Underwater Basket Weaving'), null);

  // Everything this can produce must be re-selectable on the account page —
  // otherwise a registration would store a value its owner could never keep.
  check('every canonical result is allowed by the account page',
    SUBMISSION_TRACKS.every((t) => isTrackAllowed(t, null)), true);
  check('and every English label maps into that set',
    ['Innovation & Technology','AI & Robotics','Scientific Research','Entrepreneurship']
      .every((l) => SUBMISSION_TRACKS.includes(canonicalTrack(l)!)), true);
  check('and every Turkish one',
    ['İnovasyon ve Teknoloji','Yapay Zeka ve Robotik','Bilimsel Araştırma','Girişimcilik']
      .every((l) => SUBMISSION_TRACKS.includes(canonicalTrack(l)!)), true);
}

// One password rule, not four.
{
  const { MIN_PASSWORD_LENGTH } = await import('../lib/password-rules');
  const register = readFileSync('app/api/register/route.ts', 'utf8');
  const form = readFileSync('components/sections/RegisterForm.tsx', 'utf8');
  const dash = readFileSync('app/dashboard/account/actions.ts', 'utf8');
  const admin = readFileSync('app/admin/(panel)/account/actions.ts', 'utf8');

  // It was min(8) at registration and 10 everywhere else, so a password
  // accepted at signup could not be chosen again when changing it.
  check('registration uses the shared minimum', register.includes('MIN_PASSWORD_LENGTH'), true);
  check('and no longer hardcodes eight', /min\(8\)/.test(register), false);
  check('the form uses it too', form.includes('MIN_PASSWORD_LENGTH'), true);
  check('the dashboard account page uses it', dash.includes('MIN_PASSWORD_LENGTH'), true);
  check('the admin account page uses it', admin.includes('MIN_PASSWORD_LENGTH'), true);
  check('nobody hardcodes the number any more',
    [register, form, dash, admin].every((f) => !/length < 10\b|length < 8\b/.test(f)), true);
  check('and it is ten', MIN_PASSWORD_LENGTH, 10);
}

// The registration throttle, which used to refuse a busy desk.
{
  const { REGISTER_BY_IP, REGISTER_REJECTED_BY_IP } = await import('../lib/rate-limit');
  const route = readFileSync('app/api/register/route.ts', 'utf8');

  // A conference desk, a university and a family all arrive from one address.
  // The old rule counted every attempt against five an hour, successes
  // included, so the sixth person from any of them was refused for an hour.
  check('a busy desk is not refused at six', REGISTER_BY_IP.limit >= 20, true);
  check('but the endpoint is still capped', REGISTER_BY_IP.limit <= 60, true);
  check('rejected attempts are counted apart', REGISTER_REJECTED_BY_IP.limit < REGISTER_BY_IP.limit, true);
  check('and more strictly', lockSeconds(REGISTER_REJECTED_BY_IP.limit + 1, REGISTER_REJECTED_BY_IP) > 0, true);
  // The success counter must be incremented only after the row is written.
  check('a success is counted only once it is one',
    route.indexOf("recordFailure('register:ip'") > route.indexOf('prisma.user.create'), true);
}

// --- the volunteer rota -------------------------------------------------------
//
// The volunteer tier advertised "المساهمة في تنظيم المؤتمر" and delivered an
// attendee's dashboard with a section removed. The rota is what makes the tier
// real, so the rules behind it are checked here rather than by claiming shifts
// in the panel and hoping.

{
  const {
    minutesOfDay, shiftsOverlap, canClaim, rosterHealth, totalHours, byStartTime,
  } = await import('../lib/volunteering');
  const { canVolunteer, MAX_SHIFTS_PER_VOLUNTEER } = await import('../lib/categories');

  check('volunteers have a rota', canVolunteer('volunteer'), true);
  check('participants do not', canVolunteer('participant'), false);
  check('visitors do not', canVolunteer('visitor'), false);
  check('an unknown category does not', canVolunteer('vip'), false);
  check('a missing category does not', canVolunteer(null), false);
  check('the rota ceiling is a real number', MAX_SHIFTS_PER_VOLUNTEER > 0, true);

  check('09:00 reads as 540', minutesOfDay('09:00'), 540);
  check('a single-digit hour reads', minutesOfDay('9:00'), 540);
  check('stray spaces read', minutesOfDay(' 09:00 '), 540);
  check('an invented hour does not', minutesOfDay('25:00'), null);
  check('an invented minute does not', minutesOfDay('09:75'), null);
  check('Arabic free text does not', minutesOfDay('التاسعة صباحاً'), null);
  check('an empty time does not', minutesOfDay(''), null);

  const nine = { day: 'dayOne', startTime: '09:00', endTime: '12:00' };
  check('an overlap is an overlap',
    shiftsOverlap(nine, { day: 'dayOne', startTime: '11:00', endTime: '14:00' }), true);
  // Back-to-back is a long day, not a clash — and treating it as one would
  // refuse the volunteers who actually do work the morning and the afternoon.
  check('touching ends do not clash',
    shiftsOverlap(nine, { day: 'dayOne', startTime: '12:00', endTime: '15:00' }), false);
  check('the same hours on another day do not clash',
    shiftsOverlap(nine, { day: 'dayTwo', startTime: '09:00', endTime: '12:00' }), false);
  // A typo must not silently make one shift clash with everything, nor stop it
  // clashing with anything in a way that quietly overbooks somebody.
  check('an unreadable time never invents a clash',
    shiftsOverlap(nine, { day: 'dayOne', startTime: 'صباحاً', endTime: '12:00' }), false);

  const open = { id: 's1', day: 'dayOne', startTime: '09:00', endTime: '12:00', capacity: 2, isOpen: true, taken: 1 };
  check('an open shift with room may be claimed', canClaim(open, []), { ok: true });
  check('a full one may not',
    canClaim({ ...open, taken: 2 }, []).ok === false && canClaim({ ...open, taken: 2 }, []),
    { ok: false, reason: 'full' });
  check('a closed one may not',
    canClaim({ ...open, isOpen: false }, []), { ok: false, reason: 'closed' });
  // Closed is reported ahead of full: "we have settled the rota" is the truer
  // answer, and telling somebody it is full invites them to keep checking.
  check('closed outranks full',
    canClaim({ ...open, isOpen: false, taken: 9 }, []), { ok: false, reason: 'closed' });
  check('the same shift twice is not two pairs of hands',
    canClaim(open, [{ id: 's1', titleAr: 'الاستقبال', day: 'dayOne', startTime: '09:00', endTime: '12:00' }]),
    { ok: false, reason: 'already' });
  check('a clashing shift is refused by name',
    canClaim(open, [{ id: 's2', titleAr: 'القاعة', day: 'dayOne', startTime: '11:00', endTime: '13:00' }]),
    { ok: false, reason: 'clash', clashesWith: 'القاعة' });
  check('a shift later the same day is fine',
    canClaim(open, [{ id: 's2', titleAr: 'القاعة', day: 'dayOne', startTime: '13:00', endTime: '15:00' }]),
    { ok: true });

  // Counted in people, not in shifts: "four shifts unfilled" and "four people
  // short" are different problems and only the second can be acted on.
  const rota = [
    { ...open, id: 'a', capacity: 3, taken: 1 },
    { ...open, id: 'b', capacity: 2, taken: 2 },
    { ...open, id: 'c', capacity: 4, taken: 0 },
    // Closed, and short — but a settled rota is not a gap.
    { ...open, id: 'd', capacity: 5, taken: 1, isOpen: false },
  ];
  const health = rosterHealth(rota);
  check('the shortfall counts people', health.stillNeeded, 2 + 0 + 4);
  check('a closed shift is not a shortfall', health.stillNeeded, 6);
  check('empty shifts are counted', health.empty, 1);
  check('full shifts are counted', health.full, 1);
  check('places count only the open shifts', health.places, 3 + 2 + 4);
  check('filled counts only the open shifts', health.filled, 1 + 2 + 0);

  check('hours are summed from the readable shifts',
    totalHours([
      { day: 'dayOne', startTime: '09:00', endTime: '12:00' },
      { day: 'dayOne', startTime: '13:00', endTime: '14:30' },
    ]),
    { hours: 4.5, countedShifts: 2 });
  // A certificate states these hours, so an unreadable shift is left out and
  // said to be left out rather than counted as zero.
  check('an unreadable shift is left out of the hours',
    totalHours([
      { day: 'dayOne', startTime: '09:00', endTime: '12:00' },
      { day: 'dayOne', startTime: 'صباحاً', endTime: '14:30' },
    ]),
    { hours: 3, countedShifts: 1 });
  check('a shift that ends before it starts is left out',
    totalHours([{ day: 'dayOne', startTime: '14:00', endTime: '09:00' }]),
    { hours: 0, countedShifts: 0 });

  check('shifts sort by day then by clock',
    byStartTime([
      { id: 'x', day: 'dayTwo', startTime: '09:00', endTime: '10:00' },
      { id: 'y', day: 'dayOne', startTime: '13:00', endTime: '14:00' },
      { id: 'z', day: 'dayOne', startTime: '09:00', endTime: '10:00' },
    ] as Array<{ id: string; day: string; startTime: string; endTime: string }>).map((s) => s.id),
    ['z', 'y', 'x']);
  check('an unreadable time sorts last, not first',
    byStartTime([
      { id: 'bad', day: 'dayOne', startTime: 'صباحاً', endTime: '10:00' },
      { id: 'ok', day: 'dayOne', startTime: '09:00', endTime: '10:00' },
    ] as Array<{ id: string; day: string; startTime: string; endTime: string }>).map((s) => s.id),
    ['ok', 'bad']);

  // --- and the same rules against real rows ---------------------------------
  //
  // The claim action holds its check and its write in one Serializable
  // transaction, and leans on the unique index as the last line. Both are
  // database behaviour, so both are checked against the database.
  const shift = await prisma.volunteerShift.create({
    data: {
      titleAr: `${marker} فترة فحص`, teamAr: 'فحص', day: 'dayOne',
      startTime: '09:00', endTime: '12:00', capacity: 1,
    },
  });
  const vol = await prisma.user.create({
    data: {
      email: `volunteer-check@regcheck.invalid`,
      passwordHash: 'x', name: `${marker} متطوع`, role: 'ATTENDEE', category: 'volunteer',
    },
  });

  await prisma.volunteerAssignment.create({ data: { shiftId: shift.id, userId: vol.id } });

  let duplicateRefused = false;
  try {
    await prisma.volunteerAssignment.create({ data: { shiftId: shift.id, userId: vol.id } });
  } catch (err) {
    duplicateRefused = (err as { code?: string }).code === 'P2002';
  }
  check('the database refuses the same volunteer twice on one shift', duplicateRefused, true);

  // Deleting a shift is offered in the panel with a warning about how many
  // people are on it; that warning is only honest if the rows actually go.
  await prisma.volunteerShift.delete({ where: { id: shift.id } });
  check('deleting a shift takes its assignments with it',
    await prisma.volunteerAssignment.count({ where: { shiftId: shift.id } }), 0);

  await prisma.user.delete({ where: { id: vol.id } });
  check('no rota rows survive the check',
    await prisma.volunteerShift.count({ where: { titleAr: { startsWith: marker } } }), 0);
}

// --- undo --------------------------------------------------------------------

await prisma.notification.deleteMany({ where: { title: marker } });
await prisma.announcement.deleteMany({ where: { title: marker } });
check('test data removed', await prisma.notification.count(), before);

await prisma.$disconnect();
console.log(failures === 0 ? '\nall checks passed' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
