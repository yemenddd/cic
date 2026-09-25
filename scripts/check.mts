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
const { generateConfirmationCode } = await import('../lib/confirmation-code');
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
const { MIN_PASSWORD_LENGTH } = await import('../lib/password-rules');
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

check('a path from the offered list is accepted', isTrackAllowed('مسار البحث العلمي', null), true);
check('clearing the path is allowed', isTrackAllowed('', 'مسار البحث العلمي'), true);
check('an invented path is refused', isTrackAllowed('مسار مخترع', 'مسار البحث العلمي'), false);
check('a legacy value the account already holds is kept', isTrackAllowed('مسار قديم', 'مسار قديم'), true);
check('but not one held by somebody else', isTrackAllowed('مسار قديم', 'مسار البحث العلمي'), false);

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

// Anything a previous run left behind, before adding more.
//
// The undo at the bottom of this file only runs if the script reaches it. A
// run stopped part-way — Ctrl-C, a failed check, a dropped database
// connection — leaves its announcement in place, and because delivery fans out
// to every registered account, one abandoned row also leaves a notification in
// a few hundred real people's bells. Nine of them had accumulated that way,
// visible on the organizers' dashboard as recent activity. So each run starts
// by clearing the wreckage of the last one, and the cleanup no longer depends
// on this script finishing.
const stale = { title: { contains: '[check ' } };
const staleNotifications = await prisma.notification.deleteMany({ where: stale });
const staleAnnouncements = await prisma.announcement.deleteMany({ where: stale });
if (staleAnnouncements.count || staleNotifications.count) {
  console.log(`  swept ${staleAnnouncements.count} announcement(s) and `
    + `${staleNotifications.count} notification(s) left by an interrupted run`);
}

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
// Counted among the rows this run wrote, rather than against a snapshot of
// the whole table: the platform is live, and a real registration approved by
// an organizer mid-run would otherwise read as a leak from this announcement.
check('no other feed was touched',
  await prisma.notification.count({ where: { title: marker } }), expected);

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

// Deliberately an *admitted* attendee. The door now refuses an account the
// committee has not let in, so picking whoever came first would make "a valid
// badge is counted" fail the moment somebody is waiting in the real queue —
// which is a true fact about the door, reported as a broken check.
const scanned = await prisma.user.findFirst({
  where: { role: 'ATTENDEE', status: 'APPROVED' },
  select: { id: true },
});

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

  // --- the door is where "registered" and "admitted" are told apart ----------
  //
  // A badge is a bearer object: whoever holds it can present it. So a valid
  // signature proves the platform issued the badge and nothing about whether
  // its holder was ever let in — which is why the scanner asks the database
  // rather than trusting the signature alone.
  {
    const waiting = await prisma.user.create({
      data: {
        email: `gate-pending-${Date.now()}@regcheck.invalid`,
        passwordHash: 'x',
        name: `${marker} منتظر`,
        role: 'ATTENDEE',
        category: 'participant',
        status: 'PENDING',
      },
    });
    const refused = await prisma.user.create({
      data: {
        email: `gate-rejected-${Date.now()}@regcheck.invalid`,
        passwordHash: 'x',
        name: `${marker} مرفوض`,
        role: 'ATTENDEE',
        category: 'volunteer',
        status: 'REJECTED',
      },
    });

    await prisma.checkpoint.update({ where: { id: gate.id }, data: { isOpen: true } });

    const pendingScan = await recordAttendance({
      checkpointId: gate.id,
      raw: badgeToken(waiting.id),
      method: 'QR',
      recordedById: admin.id,
    });
    check('a waiting account is not counted through the gate', pendingScan.status, 'not-admitted');
    // The organizer at the door has to be able to name them, or "refused" is
    // an argument rather than a redirection to the desk.
    check('and the door is told who it is',
      pendingScan.status === 'not-admitted' && pendingScan.attendee.name?.includes('منتظر'), true);
    check('and why', pendingScan.status === 'not-admitted' && pendingScan.accountStatus, 'PENDING');

    check('a refused account is not counted either',
      (await recordAttendance({
        checkpointId: gate.id,
        raw: badgeToken(refused.id),
        method: 'QR',
        recordedById: admin.id,
      })).status,
      'not-admitted');

    // Typing the printed code instead of scanning is the same door.
    // Generated rather than hardcoded: a run interrupted before its cleanup
    // used to leave this code behind and poison every run after it with a
    // unique-constraint failure that looked like a real bug.
    const byCode = await prisma.user.update({
      where: { id: waiting.id },
      data: { confirmationCode: generateConfirmationCode() },
    });
    check('nor by typing their confirmation code',
      (await recordAttendance({
        checkpointId: gate.id,
        raw: byCode.confirmationCode!,
        method: 'MANUAL',
        recordedById: admin.id,
      })).status,
      'not-admitted');

    check('and nothing was written for either of them',
      await prisma.attendance.count({ where: { userId: { in: [waiting.id, refused.id] } } }), 0);

    // Approved a moment later, the same badge works — the refusal is about the
    // decision, not about the badge.
    await prisma.user.update({ where: { id: waiting.id }, data: { status: 'APPROVED' } });
    check('once admitted, the same badge counts',
      (await recordAttendance({
        checkpointId: gate.id,
        raw: badgeToken(waiting.id),
        method: 'QR',
        recordedById: admin.id,
      })).status,
      'recorded');

    await prisma.user.deleteMany({ where: { id: { in: [waiting.id, refused.id] } } });
    await prisma.checkpoint.update({ where: { id: gate.id }, data: { isOpen: false } });
  }

  await prisma.checkpoint.update({ where: { id: gate.id }, data: { isOpen: false } });
  const other = await prisma.user.findFirst({
    where: { role: 'ATTENDEE', status: 'APPROVED', id: { not: scanned.id } },
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

  // Written against MIN_PASSWORD_LENGTH rather than a literal, so lowering or
  // raising the rule moves these with it instead of breaking them.
  const oneShort = 'q7w2e9r4t1y6u3'.slice(0, MIN_PASSWORD_LENGTH - 1);
  const exactly = 'q7w2e9r4t1y6u3'.slice(0, MIN_PASSWORD_LENGTH);

  check('nothing typed has no verdict', passwordStrength('').label, '');
  check('under the minimum is too short', level(oneShort), 'tooShort');
  check('and says how many characters remain',
    passwordStrength(oneShort).advice?.includes('بقي 1'), true);
  check('exactly the minimum is not too short', level(exactly) !== 'tooShort', true);

  // Length alone must not rescue a notorious password.
  check('a long common password is still weak', level('password12345678'), 'weak');
  check('leetspeak does not save it', level('passw0rd123456789'), 'weak');
  check('the address is not a password', level('reemalsharabi99', 'reemalsharabi@example.com'), 'weak');
  check('repeated characters are weak', level('aaaabbbbcccc'), 'weak');
  check('a run of consecutive characters is weak', level('abcdefghijkl'), 'weak');

  // Length is what actually costs an attacker time, so it outranks symbols.
  check('a long ordinary phrase is strong', level('mountain river lantern'), 'strong');
  // Complexity does not rescue something under the minimum — the rule is a
  // floor, not a score to be argued with.
  check('complexity does not rescue a too-short one',
    level('Xk7#mQ2!p'.slice(0, MIN_PASSWORD_LENGTH - 1)), 'tooShort');
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
  check('an Arabic path passes through', canonicalTrack('مسار البحث العلمي'), 'مسار البحث العلمي');
  check('an English label becomes the Arabic one',
    canonicalTrack('Scientific Research Path'), 'مسار البحث العلمي');
  check('and a Turkish one',
    canonicalTrack('Bilimsel Araştırma Yolu'), 'مسار البحث العلمي');
  check('the invention path, English',
    canonicalTrack('Invention & Innovation Path'), 'مسار الاختراع والابتكار');
  check('the invention path, Turkish',
    canonicalTrack('İcat ve İnovasyon Yolu'), 'مسار الاختراع والابتكار');
  // The four retired tracks still resolve: a form left open over lunch posts
  // the label it was rendered with, and refusing it would make a registration
  // that cannot be completed.
  check('a retired English label still resolves',
    canonicalTrack('Entrepreneurship'), 'مسار الاختراع والابتكار');
  check('a retired Turkish label still resolves',
    canonicalTrack('Girişimcilik'), 'مسار الاختراع والابتكار');
  check('case does not matter',
    canonicalTrack('scientific research path'), 'مسار البحث العلمي');
  check('surrounding space does not matter',
    canonicalTrack('  Invention & Innovation Path  '), 'مسار الاختراع والابتكار');

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
  // Not pinned to a number — that is a product decision and it has already
  // changed once. What is pinned is that it exists, is enforceable, and that
  // the browser's own attribute agrees with it: a form that lets through what
  // the server then refuses is the bug this block was written for.
  check('the minimum is a real floor', MIN_PASSWORD_LENGTH >= 6 && MIN_PASSWORD_LENGTH <= 64, true);
  check('and the form input agrees with the server',
    form.includes('minLength={MIN_PASSWORD_LENGTH}'), true);
  check('and the note quotes it rather than a literal',
    /passwordNote[^\n]*MIN_PASSWORD_LENGTH|\$\{MIN_PASSWORD_LENGTH\} أحرف/.test(form), true);
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

  const MEDIA = 'media';
  const open = {
    id: 's1', day: 'dayOne', startTime: '09:00', endTime: '12:00',
    capacity: 2, isOpen: true, taken: 1, committee: MEDIA,
  };
  check('an open shift with room may be claimed', canClaim(open, [], MEDIA), { ok: true });
  check('a full one may not',
    canClaim({ ...open, taken: 2 }, [], MEDIA), { ok: false, reason: 'full' });
  check('a closed one may not',
    canClaim({ ...open, isOpen: false }, [], MEDIA), { ok: false, reason: 'closed' });
  // Closed is reported ahead of full: "we have settled the rota" is the truer
  // answer, and telling somebody it is full invites them to keep checking.
  check('closed outranks full',
    canClaim({ ...open, isOpen: false, taken: 9 }, [], MEDIA), { ok: false, reason: 'closed' });
  check('the same shift twice is not two pairs of hands',
    canClaim(open, [{ id: 's1', titleAr: 'الاستقبال', day: 'dayOne', startTime: '09:00', endTime: '12:00' }], MEDIA),
    { ok: false, reason: 'already' });
  check('a clashing shift is refused by name',
    canClaim(open, [{ id: 's2', titleAr: 'القاعة', day: 'dayOne', startTime: '11:00', endTime: '13:00' }], MEDIA),
    { ok: false, reason: 'clash', clashesWith: 'القاعة' });
  check('a shift later the same day is fine',
    canClaim(open, [{ id: 's2', titleAr: 'القاعة', day: 'dayOne', startTime: '13:00', endTime: '15:00' }], MEDIA),
    { ok: true });

  // A shift belongs to one committee and a volunteer works with one committee.
  check('another committee\'s shift may not be claimed',
    canClaim(open, [], 'logistics'), { ok: false, reason: 'committee' });
  check('nor may any shift before a committee is chosen',
    canClaim(open, [], null), { ok: false, reason: 'nocommittee' });
  // Reported ahead of full and closed: telling somebody a slot is full when the
  // real answer is that it is not theirs sends them back to check it hourly.
  check('the committee outranks full and closed',
    canClaim({ ...open, taken: 9, isOpen: false }, [], 'logistics'),
    { ok: false, reason: 'committee' });
  // But a shift they already hold still reads as theirs even if an organizer
  // moved them — otherwise the release button would turn into a refusal and
  // they could never give it back.
  check('a held shift stays releasable after a committee change',
    canClaim(open, [{ id: 's1', titleAr: 'الإعلام', day: 'dayOne', startTime: '09:00', endTime: '12:00' }], 'logistics'),
    { ok: false, reason: 'already' });

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
      titleAr: `${marker} فترة فحص`, committee: 'media', day: 'dayOne',
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

// --- being admitted, which is not the same as registering ---------------------
//
// Anybody may fill in the form; presenting a project or joining the organizing
// team is a decision. The rule is checked here because getting it wrong in
// either direction is serious: too strict and 200 people are locked out of
// accounts they already use, too loose and the queue is decorative.

{
  const {
    needsApproval, initialStatus, signInRefusal, refusalCode, statusFromRefusalCode,
  } = await import('../lib/account-status');
  const { loginErrorMessage } = await import('../lib/login-error');

  check('a participant waits', needsApproval('participant'), true);
  check('a volunteer waits', needsApproval('volunteer'), true);
  // A visitor is admitted on the spot: attending a public session is what the
  // form is for, and a queue for it would have nothing at the end.
  check('a visitor does not wait', needsApproval('visitor'), false);
  check('an unknown category does not', needsApproval('vip'), false);
  check('a missing category does not', needsApproval(null), false);

  check('a participant starts pending', initialStatus('participant'), 'PENDING');
  check('a volunteer starts pending', initialStatus('volunteer'), 'PENDING');
  check('a visitor starts approved', initialStatus('visitor'), 'APPROVED');

  check('an approved account is not refused', signInRefusal('APPROVED'), null);
  check('a waiting one is told it is waiting',
    signInRefusal('PENDING')?.includes('بانتظار موافقة'), true);
  check('a refused one is told it was refused',
    signInRefusal('REJECTED')?.includes('لم يُقبل'), true);
  check('and the committee reason is carried through',
    signInRefusal('REJECTED', 'الفئة لا تناسب طلبك')?.includes('الفئة لا تناسب طلبك'), true);

  // The status travels through Auth.js as a short code and has to survive the
  // round trip, or the sign-in screen falls back to "wrong credentials" — the
  // one message this whole feature exists to stop showing.
  for (const status of ['PENDING', 'REJECTED'] as const) {
    check(`the ${status.toLowerCase()} code round-trips`,
      statusFromRefusalCode(refusalCode(status)), status);
  }
  check('an unrelated code is not mistaken for a status',
    statusFromRefusalCode('throttled-5'), null);
  check('a waiting account never reads as wrong credentials',
    loginErrorMessage(refusalCode('PENDING')).includes('بانتظار'), true);
  check('a real typo still does', loginErrorMessage(undefined), 'بيانات الدخول غير صحيحة');
  check('and a throttle still does its own thing',
    loginErrorMessage('throttled-3').includes('3 دقائق'), true);

  // --- against real rows ----------------------------------------------------
  //
  // The migration admitted everybody who already had an account. If that had
  // failed, every existing attendee — and the organizers — would be locked out
  // the moment this deploys, which is not a thing to take on faith.
  check('nobody who already had an account was locked out',
    await prisma.user.count({ where: { status: 'PENDING', createdAt: { lt: new Date('2026-09-22') } } }),
    0);
}

// --- the six committees --------------------------------------------------------

{
  const { COMMITTEES, committeeLabel, isCommittee, canonicalCommittee } = await import(
    '../lib/committees'
  );

  check('there are six committees', COMMITTEES.length, 6);
  check('every committee has a distinct id',
    new Set(COMMITTEES.map((c) => c.id)).size, COMMITTEES.length);
  check('and every one says what it does',
    COMMITTEES.every((c) => c.descriptionAr.length > 10), true);

  check('the media committee resolves', committeeLabel('media'), 'الإعلام');
  check('an unknown id resolves to nothing', committeeLabel('catering'), '');
  check('a null id resolves to nothing', committeeLabel(null), '');
  check('a known id is a committee', isCommittee('logistics'), true);
  check('an invented one is not', isCommittee('logistcs'), false);

  // The label is accepted as well as the id, so a form built before the ids
  // existed still resolves rather than being refused.
  check('the Arabic label maps back to its id',
    canonicalCommittee('المالية والحسابات'), 'finance');
  check('an id maps to itself', canonicalCommittee('programs'), 'programs');
  check('anything else is refused', canonicalCommittee('لجنة الضيافة'), null);
  check('and so is nothing at all', canonicalCommittee(''), null);
}

// --- the two paths, and the four they replaced --------------------------------

{
  const { SUBMISSION_TRACKS, canonicalTrack } = await import('../lib/submissions');

  check('there are two paths', SUBMISSION_TRACKS.length, 2);
  check('invention is one', SUBMISSION_TRACKS[0], 'مسار الاختراع والابتكار');
  check('research is the other', SUBMISSION_TRACKS[1], 'مسار البحث العلمي');

  check('the English label resolves',
    canonicalTrack('Scientific Research Path'), 'مسار البحث العلمي');
  check('the Turkish label resolves',
    canonicalTrack('İcat ve İnovasyon Yolu'), 'مسار الاختراع والابتكار');

  // A cached page or a stale tab still posts one of the four retired labels.
  // Refusing those would turn a form somebody left open over lunch into a
  // registration that cannot be completed.
  check('a retired track still resolves',
    canonicalTrack('الذكاء الاصطناعي والروبوتات'), 'مسار الاختراع والابتكار');
  check('the retired research track lands on the research path',
    canonicalTrack('البحث العلمي'), 'مسار البحث العلمي');
  check('a retired English label resolves',
    canonicalTrack('AI & Robotics'), 'مسار الاختراع والابتكار');
  check('empty is still a real answer', canonicalTrack(''), '');
  check('an invented one is still refused', canonicalTrack('مسار الطبخ'), null);

  // Nothing may be left on a value the form can no longer offer: the track is
  // printed on a certificate, and its owner could never re-select it.
  const stray = await prisma.user.findMany({
    where: { track: { notIn: [...SUBMISSION_TRACKS, ''] }, NOT: { track: null } },
    select: { track: true },
    take: 5,
  });
  check('no account is left on a retired track', stray.map((u) => u.track), []);
}

// --- what may be attached to a submission --------------------------------------

{
  const {
    checkDocumentUpload, MAX_DOCUMENT_BYTES, MAX_FILES_PER_SUBMISSION, DOCUMENT_ACCEPT,
  } = await import('../lib/upload-rules');

  const file = (name: string, type: string, size: number) => ({ name, type, size });

  check('a PDF is accepted', checkDocumentUpload(file('paper.pdf', 'application/pdf', 2_000_000)), null);
  check('a photograph of a prototype is accepted',
    checkDocumentUpload(file('rig.jpg', 'image/jpeg', 900_000)), null);
  // Not a format question — a public URL on a domain this site's CSP does not
  // govern, reachable by anyone signed in.
  check('an SVG is refused',
    checkDocumentUpload(file('x.svg', 'image/svg+xml', 1000))?.includes('غير مدعومة'), true);
  check('an executable is refused',
    checkDocumentUpload(file('x.exe', 'application/x-msdownload', 1000))?.includes('غير مدعومة'), true);
  check('an oversized file is refused',
    checkDocumentUpload(file('big.pdf', 'application/pdf', MAX_DOCUMENT_BYTES + 1))?.includes('الحد الأقصى'),
    true);
  check('an empty file is refused',
    checkDocumentUpload(file('empty.pdf', 'application/pdf', 0))?.includes('فارغ'), true);
  // Somebody who picked five at once has to be told which of them was wrong.
  check('the refusal names the file',
    checkDocumentUpload(file('ملحق.exe', 'application/x-msdownload', 10))?.includes('ملحق.exe'), true);

  check('the picker offers what the server accepts',
    DOCUMENT_ACCEPT.includes('application/pdf') && !DOCUMENT_ACCEPT.includes('image/svg+xml'), true);
  check('a submission may carry a handful of files', MAX_FILES_PER_SUBMISSION, 5);
}

// --- what each certificate actually says ---------------------------------------
//
// Three categories were sharing two sentences: a volunteer and a visitor were
// both told they "شارك في فعاليات المؤتمر", which is true of anybody who walked
// through the door. These are printed, signed and shown to employers, so each
// one has to claim what that person did and nothing more.

{
  const { certificateWording } = await import('../lib/certificate-wording');
  const { committeeLabel, committeeLabelEn } = await import('../lib/committees');

  const base = {
    categoryLabel: 'متطوع',
    dateAr: '2-3 أكتوبر 2026',
    dateEn: 'Oct 2–3, 2026',
    locationAr: 'إسطنبول - تركيا',
    locationEn: 'Istanbul, Turkey',
  };

  const volunteer = certificateWording({
    ...base,
    categoryId: 'volunteer',
    committeeAr: committeeLabel('media'),
    committeeEn: committeeLabelEn('media'),
    volunteerHours: 7,
  });
  check('a volunteer gets a volunteering certificate', volunteer.titleAr, 'شهادة تطوّع');
  check('and it says so in English', volunteer.titleEn, 'Certificate of Volunteering');
  check('it names their committee', volunteer.bodyAr.includes('لجنة الإعلام'), true);
  check('in English too', volunteer.bodyEn.includes('Media committee'), true);
  // The hours are the whole point: an employer reads the number, not the
  // adjective in the title.
  check('it states the hours', volunteer.bodyAr.includes('7 ساعات'), true);
  check('in English too', volunteer.bodyEn.includes('7 hours'), true);
  check('one hour is singular in English',
    certificateWording({ ...base, categoryId: 'volunteer', volunteerHours: 1 })
      .bodyEn.includes('1 hour of'), true);
  check('two hours carries the Arabic dual',
    certificateWording({ ...base, categoryId: 'volunteer', volunteerHours: 2 })
      .bodyAr.includes('ساعتين'), true);
  // A volunteer with no recorded shift gets the sentence without a figure
  // rather than a certificate claiming zero hours.
  check('no recorded hours claims no hours',
    certificateWording({ ...base, categoryId: 'volunteer', volunteerHours: 0 }).bodyAr.includes('بواقع'),
    false);
  check('and no committee claims no committee',
    certificateWording({ ...base, categoryId: 'volunteer' }).bodyAr.includes('لجنة'), false);

  const inventor = certificateWording({
    ...base,
    categoryId: 'participant',
    categoryLabel: 'مشارك',
    track: 'مسار الاختراع والابتكار',
    projectTitle: 'ذراع آلية للإنقاذ',
    approvedProjects: 1,
  });
  check('a participant gets a participation certificate', inventor.titleAr, 'شهادة مشاركة');
  check('the invention path says invention', inventor.bodyAr.includes('ابتكاره'), true);
  check('and names the work', inventor.bodyAr.includes('«ذراع آلية للإنقاذ»'), true);
  check('in English too', inventor.bodyEn.includes('Invention & Innovation Path'), true);

  const researcher = certificateWording({
    ...base,
    categoryId: 'participant',
    categoryLabel: 'مشارك',
    track: 'مسار البحث العلمي',
    approvedProjects: 0,
  });
  // The two paths are judged differently and must not read identically: a
  // paper is not an invention, and a certificate saying otherwise is wrong
  // about the one thing it exists to record.
  check('the research path says research', researcher.bodyAr.includes('بحثه'), true);
  check('and not invention', researcher.bodyAr.includes('ابتكاره'), false);
  check('in English too', researcher.bodyEn.includes('their research'), true);
  // Nothing approved: no work is named rather than an empty pair of quotes.
  check('an unapproved participant names no work', researcher.bodyAr.includes('«'), false);
  check('several approved works are not listed one by one',
    certificateWording({ ...base, categoryId: 'participant', track: 'مسار البحث العلمي', approvedProjects: 3, projectTitle: 'أ' })
      .bodyAr.includes('بأعماله المقبولة'), true);

  const visitor = certificateWording({ ...base, categoryId: 'visitor', categoryLabel: 'زائر' });
  check('a visitor gets an attendance certificate', visitor.titleAr, 'شهادة حضور');
  check('and it says attendance in English', visitor.titleEn, 'Certificate of Attendance');
  check('it claims attendance', visitor.bodyAr.includes('حضر فعاليات'), true);
  // Claiming participation for somebody who came to watch is what makes every
  // other certificate here worth less.
  check('and claims nothing more', visitor.bodyAr.includes('شارك في'), false);
  check('nor in English', visitor.bodyEn.includes('participated'), false);

  // An account with no category at all still has to print something true.
  const unknown = certificateWording({ ...base, categoryId: '', categoryLabel: '' });
  check('an unknown category falls back to attendance', unknown.titleAr, 'شهادة حضور');

  // Both halves of one sheet, always: a document with an empty English column
  // is a document somebody has to explain.
  for (const [label, w] of [['volunteer', volunteer], ['participant', inventor], ['visitor', visitor]] as const) {
    check(`the ${label} sheet has both languages`,
      w.bodyAr.length > 40 && w.bodyEn.length > 40 && w.titleAr !== '' && w.titleEn !== '', true);
    check(`the ${label} date and place appear in both`,
      w.bodyAr.includes(base.dateAr) && w.bodyEn.includes(base.dateEn)
        && w.bodyAr.includes(base.locationAr) && w.bodyEn.includes(base.locationEn),
      true);
  }
}

// --- one badge, issued twice ---------------------------------------------------
//
// The pass handed over at registration and the one on /dashboard/badge have to
// be the same object, not two that resemble each other. The registration copy
// carried a decorative barcode, so somebody who saved it and never signed in
// was holding a badge the door scanner could not read.

{
  const route = readFileSync('app/api/register/route.ts', 'utf8');
  const form = readFileSync('components/sections/RegisterForm.tsx', 'utf8');
  const confirmation = readFileSync('components/sections/RegisterConfirmation.tsx', 'utf8');
  const dashboard = readFileSync('app/dashboard/badge/page.tsx', 'utf8');

  check('registration issues a badge token', route.includes('badgeToken(created.id)'), true);
  // To everybody, including an application still waiting. The badge is not a
  // key — the door checks admission against the database — and because the
  // token is a pure function of the account id, the card saved at signup
  // becomes valid the moment the committee approves. Plenty of people register
  // and never open the platform again; the card in their hand has to be final.
  check('to everyone, so the card handed over is the final one',
    route.includes('badge: badgeToken(created.id)'), true);
  check('and the registration screen renders it', form.includes('qrValue={badgeToken'), true);
  check('and so does the shared link', confirmation.includes('qrValue={qrValue'), true);
  // Both derive from the account id. Deriving one from the confirmation code
  // instead would produce a second, different badge for the same person.
  check('the dashboard derives it the same way',
    dashboard.includes('badgeToken(session.user.id)'), true);

  // The real proof: a token minted the way registration mints it verifies as
  // the account it belongs to.
  const someone = await prisma.user.findFirst({ where: { role: 'ATTENDEE' }, select: { id: true } });
  if (someone) {
    const issued = badgeToken(someone.id);
    check('a badge issued at registration verifies', verifyBadgeToken(issued), someone.id);
    check('and it is byte-identical to the dashboard one', issued, badgeToken(someone.id));
  }

  // Registration creates an account, and the screen used to show a card and a
  // link — so somebody who saved the card never learned they had one.
  check('the screen says an account exists', form.includes('accountReadyTitle'), true);
  check('and names the address they sign in with', form.includes('accountEmailLabel'), true);
  check('a waiting account is offered sign-in, not the dashboard',
    form.includes("href=\"/login\"") && form.includes("href=\"/dashboard\""), true);
  check('the shared link says so too', confirmation.includes('لديك حساب في منصة المؤتمر'), true);
}

// --- somebody who turned up without registering --------------------------------

{
  const { validateWalkIn, walkInFields, walkInEmail, isWalkInEmail, WALK_IN_EMAIL_DOMAIN } =
    await import('../lib/walk-in');

  const ok = { name: 'سالم عبده', phone: '+967 770 123456', category: 'visitor' };
  check('a name and a phone are enough', validateWalkIn(ok), null);
  check('a blank name is refused', validateWalkIn({ ...ok, name: ' ' })?.includes('اسم'), true);
  check('a single letter is refused', validateWalkIn({ ...ok, name: 'س' })?.includes('اسم'), true);
  check('a blank phone is refused', validateWalkIn({ ...ok, phone: '' })?.includes('الهاتف'), true);
  // "لا يوجد" typed into a phone box is worse than an empty column: it looks
  // like a number to everything that reads the table afterwards.
  check('words in the phone box are refused',
    validateWalkIn({ ...ok, phone: 'لا يوجد' })?.includes('غير مكتمل'), true);
  check('a too-short number is refused',
    validateWalkIn({ ...ok, phone: '12345' })?.includes('غير مكتمل'), true);
  // Forgiving about the shape, because the desk is standing up with a queue.
  check('spaces and dashes are fine', validateWalkIn({ ...ok, phone: '0770-123-456' }), null);
  check('a missing category is refused', validateWalkIn({ ...ok, category: '' })?.includes('فئة'), true);

  check('fields are trimmed',
    walkInFields({ name: '  ريم  ', phone: ' 770111222 ', category: 'visitor', organization: '  ' }),
    { name: 'ريم', phone: '770111222', category: 'visitor', organization: null, country: null });

  // .invalid is reserved by RFC 2606 so it can never resolve. A plausible
  // placeholder on a real domain would eventually be mailed — and bounce, or
  // reach a stranger.
  check('the address cannot resolve', WALK_IN_EMAIL_DOMAIN.endsWith('.invalid'), true);
  check('it is unique per code', walkInEmail('CIC-2026-ABC123') === walkInEmail('CIC-2026-ABC124'), false);
  check('and it is recognisable as invented', isWalkInEmail(walkInEmail('CIC-2026-ABC123')), true);
  check('a real address is not', isWalkInEmail('someone@example.com'), false);
  check('and neither is nothing', isWalkInEmail(null), false);
}

// --- what the door learned ------------------------------------------------------
//
// The figures the next conference is planned from. Checked as pure functions
// over fixed rows, because "how many came" being quietly wrong is the kind of
// mistake nobody catches by looking at a chart.

{
  const {
    turnout, turnoutByCategory, arrivalCurve, dayRetention, methodSplit,
    checkpointLoad, rankAttended, byRecorder, clockLabel, venueMinutes,
  } = await import('../lib/attendance-analytics');

  const person = (id: string, category: string, extra: Partial<{ country: string; organization: string; walkIn: boolean }> = {}) => ({
    id, category, country: extra.country ?? null, organization: extra.organization ?? null,
    walkIn: extra.walkIn ?? false,
  });

  // Venue time is UTC+3; a scan at 06:00 UTC is 09:00 at the door, and a
  // report that said 06:00 would have people arriving before the gates opened.
  check('times are read at the venue, not in UTC',
    clockLabel(venueMinutes(new Date('2026-10-02T06:00:00Z'))), '09:00');
  check('and it wraps past midnight correctly',
    clockLabel(venueMinutes(new Date('2026-10-02T22:30:00Z'))), '01:30');

  const at = (h: number, m = 0) => new Date(Date.UTC(2026, 9, 2, h - 3, m));
  const row = (userId: string, checkpointId: string, hour: number, minute = 0, method: 'QR' | 'MANUAL' = 'QR', recordedById: string | null = 'org1') =>
    ({ userId, checkpointId, checkedInAt: at(hour, minute), method: method as never, recordedById });

  const attendees = [
    person('a', 'visitor', { country: 'اليمن' }),
    person('b', 'visitor', { country: 'اليمن' }),
    person('c', 'participant', { country: 'تركيا' }),
    person('d', 'participant'),
    person('e', 'volunteer'),
    person('w', 'visitor', { country: 'اليمن', walkIn: true }),
  ];
  const checkpoints = [
    { id: 'g1', nameAr: 'بوابة اليوم الأول', day: 'dayOne' },
    { id: 'g2', nameAr: 'بوابة اليوم الثاني', day: 'dayTwo' },
  ];
  const rows = [
    row('a', 'g1', 9, 10), row('b', 'g1', 9, 20), row('c', 'g1', 9, 40),
    row('e', 'g1', 11, 5, 'MANUAL'), row('w', 'g1', 12, 0, 'MANUAL', 'org2'),
    row('a', 'g2', 9, 30), row('c', 'g2', 10, 0),
  ];

  const t = turnout(attendees, rows);
  check('registered excludes people the door invented', t.registered, 5);
  check('attended counts each person once', t.attended, 4);
  check('no-shows are the ones who never came', t.noShows, 1);
  // A turnout rate that climbs whenever registration fails is worse than none.
  check('walk-ins are reported apart', t.walkIns, 1);
  check('and never inflate the rate', t.rate, 80);

  const byCat = turnoutByCategory(attendees, rows);
  check('categories are ranked by how many registered', byCat.map((c) => c.category), ['visitor', 'participant', 'volunteer']);
  check('each carries its own rate', byCat.find((c) => c.category === 'participant')?.rate, 50);
  check('and the walk-in is not among them',
    byCat.find((c) => c.category === 'visitor')?.registered, 2);

  const curve = arrivalCurve(rows.filter((r) => r.checkpointId === 'g1'));
  check('arrivals bucket by half-hour', curve.buckets.map((b) => b.label),
    ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00']);
  // The peak is the number a door is staffed for; the mean would say 0.7.
  check('the peak is the busiest half-hour', curve.peak?.label, '09:00');
  check('and its size', curve.peak?.count, 2);
  check('quiet half-hours are kept, not skipped', curve.buckets.find((b) => b.label === '10:00')?.count, 0);
  check('the first arrival is recorded', clockLabel(curve.firstMinutes!), '09:10');
  check('and the median arrival', clockLabel(curve.medianMinutes!), '09:40');

  const r = dayRetention(rows, checkpoints);
  check('day one counts distinct people', r.dayOne, 5);
  check('day two as well', r.dayTwo, 2);
  // Day two attendance alone cannot tell the same crowd from a different one.
  check('the overlap is what says they came back', r.both, 2);
  check('day one only', r.dayOneOnly, 3);
  check('day two only', r.dayTwoOnly, 0);
  check('and the return rate', r.returnRate, 40);

  const m = methodSplit(rows);
  check('scans are counted', m.qr, 5);
  check('and manual entries', m.manual, 2);
  // A high manual share is a badge-health signal, not a staffing one.
  check('the manual share is rounded honestly', m.manualRate, 29);

  const loads = checkpointLoad(rows, checkpoints);
  check('doors are ranked by load', loads.map((l) => l.id), ['g1', 'g2']);
  check('each with its own peak', loads[0].peakLabel, '09:00');

  // Among everybody who was in the room, walk-ins included: the question this
  // answers is what the room looked like, and somebody admitted at the door
  // was as present as somebody who registered in March.
  check('countries are counted among those who actually came',
    rankAttended(attendees, rows, 'country'), [
      { label: 'اليمن', count: 3 },
      { label: 'تركيا', count: 1 },
    ]);

  check('scanning load is ranked', byRecorder(rows).map((x) => [x.recordedById, x.count]),
    [['org1', 6], ['org2', 1]]);

  // An empty conference must produce zeros rather than NaN or a crash.
  const empty = turnout([], []);
  check('nothing at all is zero, not NaN', [empty.rate, empty.attended, empty.noShows], [0, 0, 0]);
  check('and an empty curve has no peak', arrivalCurve([]).peak, null);
  check('and empty retention divides by nothing safely', dayRetention([], checkpoints).returnRate, 0);
}

// --- mail that leaves the platform ---------------------------------------------
//
// The reason a decision reaches anybody. A refusal notification lives inside
// the account its recipient can no longer open, so the mail is not a courtesy
// here — it is the only copy.

{
  const { isDeliverable, sendEmail } = await import('../lib/email');
  const { approvalEmail, rejectionEmail, testEmail } = await import('../lib/account-emails');
  const { walkInEmail } = await import('../lib/walk-in');

  check('a real address is deliverable', isDeliverable('someone@example.org'), true);
  // The door invents an address for everybody it admits. Sending there is a
  // hard bounce, and enough hard bounces is how a sending domain stops being
  // trusted by the inbox providers that matter.
  check('a walk-in address is not', isDeliverable(walkInEmail('CIC-2026-ABC123')), false);
  check('nor is any reserved TLD', [
    isDeliverable('x@thing.invalid'),
    isDeliverable('x@thing.test'),
    isDeliverable('x@thing.example'),
    isDeliverable('x@thing.localhost'),
  ], [false, false, false, false]);
  check('nor is a non-address', [isDeliverable('nope'), isDeliverable('@x.com'), isDeliverable('x@')], [false, false, false]);
  check('nor is nothing at all', [isDeliverable(''), isDeliverable(null)], [false, false]);

  // Refused before the configuration is even consulted, so this holds whether
  // or not a key is present — the platform never tries to mail an address it
  // made up for somebody who never gave one.
  const toWalkIn = await sendEmail({
    to: walkInEmail('CIC-2026-ZZZ999'),
    subject: 'x',
    text: 'x',
  });
  check('and the sender refuses it outright',
    toWalkIn.ok === false && toWalkIn.reason, 'undeliverable');

  const approved = approvalEmail({ name: 'ريم الشيباني', categoryLabel: 'مشاركة' });
  check('an approval greets them by first name', approved.text.startsWith('مرحباً ريم،'), true);
  check('and names the category they were admitted as', approved.text.includes('بصفة مشاركة'), true);
  // Somebody told they are in needs to be told where to go next, or the mail
  // generates the question it was meant to answer.
  check('and links to sign-in', approved.text.includes('/login'), true);
  check('a nameless account still gets a greeting',
    approvalEmail({ name: null, categoryLabel: 'زائر' }).text.startsWith('مرحباً،'), true);

  const refused = rejectionEmail({ name: 'خالد', reason: 'الفئة لا تناسب طلبك' });
  // The reason is the message: a refusal without one produces a reply asking
  // why, which somebody then answers by hand.
  check('a refusal carries the committee reason', refused.text.includes('الفئة لا تناسب طلبك'), true);
  check('and invites a reply rather than ending the conversation',
    refused.text.includes('تواصل معنا'), true);
  check('and never says the word rejected at them',
    refused.subject.includes('رفض'), false);

  check('a test message says what it proves', testEmail({ to: 'a@b.com', sentBy: 'c@d.com' })
    .text.includes('إعدادات البريد سليمة'), true);

  // Both decisions must actually attempt a send — this is the wiring that was
  // missing, and it is invisible from the panel when it regresses.
  const approvals = readFileSync('app/admin/(panel)/approvals/actions.ts', 'utf8');
  check('approving sends mail', approvals.includes('approvalEmail('), true);
  check('refusing sends mail', approvals.includes('rejectionEmail('), true);
  // Sent after the write, so a slow provider cannot cost somebody their
  // decision.
  check('and the decision is committed first',
    approvals.indexOf('$transaction') < approvals.indexOf('sendEmail('), true);
}

// --- registering without an email -----------------------------------------------
//
// The field is optional now. What must stay true: a person who skips it still
// gets a complete row and a working badge, nothing ever tries to mail the
// address the platform generated for them, and a real address still behaves
// exactly as before.

{
  const { placeholderEmail, hasRealEmail, NO_EMAIL_DOMAIN, walkInEmail } = await import('../lib/walk-in');
  const { isDeliverable } = await import('../lib/email');
  const route = readFileSync('app/api/register/route.ts', 'utf8');

  check('the generated address cannot resolve', NO_EMAIL_DOMAIN.endsWith('.invalid'), true);
  check('and is unique per registration',
    placeholderEmail('CIC-2026-AAA111') === placeholderEmail('CIC-2026-AAA112'), false);
  // Generated from the confirmation code, which is already unique, so two
  // people registering in the same second cannot collide on the unique column.
  check('it is derived from the confirmation code',
    placeholderEmail('CIC-2026-AAA111').startsWith('cic-2026-aaa111@'), true);

  check('nothing will try to mail it', isDeliverable(placeholderEmail('CIC-2026-AAA111')), false);
  check('a real address is still mailable', isDeliverable('someone@example.org'), true);

  check('a generated address is not counted as one they gave',
    hasRealEmail(placeholderEmail('CIC-2026-AAA111')), false);
  check('nor is a walk-in address', hasRealEmail(walkInEmail('CIC-2026-BBB222')), false);
  check('but a real one is', hasRealEmail('someone@example.org'), true);
  check('and nothing at all is not', hasRealEmail(null), false);

  // An empty field is a real answer; a typo'd address is not — it silently
  // swallows every message meant for them, which is worse than none.
  check('the schema accepts an empty address',
    route.includes("z.literal('')"), true);
  check('and still validates a non-empty one',
    route.includes('z.string().trim().email().max(200)'), true);
  // Only a real address can collide, so the duplicate check is conditional.
  check('the duplicate check runs only on a real address',
    route.includes('if (givenEmail) {'), true);
}

// --- choosing a committee at signup ----------------------------------------------
//
// A volunteer used to register, then have to come back to the platform to pick
// a committee before their rota showed them anything they could book. Asked on
// the form now, which is one field for them and one fewer dead end.

{
  const route = readFileSync('app/api/register/route.ts', 'utf8');
  const form = readFileSync('components/sections/RegisterForm.tsx', 'utf8');

  check('the form offers the committees to volunteers only',
    form.includes("selected === 'volunteer' && ("), true);
  check('and offers the real six rather than a hand-typed list',
    form.includes('COMMITTEES.map('), true);
  // "اللوجستيك" means nothing to somebody choosing between six words.
  check('and shows what the chosen one does', form.includes('descriptionAr'), true);

  check('the route requires one from a volunteer',
    route.includes("fields.category === 'volunteer' && !committee"), true);
  check('and resolves it through the shared list',
    route.includes('canonicalCommittee(rawCommittee)'), true);
  // A committee on a visitor's row would put them on a rota they have no
  // business being on, and the organizers' "volunteers without a shift" figure
  // reads straight off this column.
  check('and stores it for nobody else',
    route.includes("fields.category === 'volunteer' ? canonicalCommittee(rawCommittee) : null"), true);
  check('the form does not post one for another category',
    form.includes("selected === 'volunteer' ? committee : ''"), true);
}

// --- a participant's own files -----------------------------------------------
//
// Covers are public because a cover is meant to be looked at. The work itself
// is not: a research paper on a public URL is protected by nothing but the
// secrecy of a link, and links are shared, logged by proxies and carried in
// referrer headers.

{
  const blob = readFileSync('lib/blob.ts', 'utf8');
  const route = readFileSync('app/api/submission-files/[id]/route.ts', 'utf8');
  const form = readFileSync('app/dashboard/innovations/SubmissionFiles.tsx', 'utf8');
  const review = readFileSync('app/admin/(panel)/submissions/[id]/page.tsx', 'utf8');

  // The blob URL is a server-side handle and must never be rendered: that is
  // what the route below is for. (Full privacy also needs a private Blob
  // store, which the account does not have — see lib/blob.ts.)
  check('reading a document goes through the server',
    blob.includes('export async function readDocument'), true);
  // Exactly one place decides how a stored document is fetched, so moving the
  // store to private access is a one-line change rather than a hunt.
  check('and only one place fetches a stored document',
    (blob.match(/fetch\(url/g) ?? []).length, 1);

  check('the route requires a session', route.includes('if (!user) return new Response'), true);
  check('and lets the owner through', route.includes('file!.submission.userId === user.id'), true);
  // The committee has to be able to open what it is judging.
  check('and any organizer', route.includes("user.role === 'ADMIN'"), true);
  // Distinguishing "not yours" from "does not exist" turns the route into a
  // way to learn which ids are real.
  check('and answers both refusals identically',
    route.includes('if (!file || !mayRead) return new Response'), true);
  check('and never lets an intermediary keep a copy',
    route.includes("'Cache-Control': 'private, no-store'"), true);
  // The filename becomes a header value. HTTP headers are Latin-1, so an
  // Arabic name thrown in raw makes the whole response throw — which is most
  // filenames this platform will ever see, and was a real 500 until it wasn't.
  check('the filename is carried in the RFC 6266 form',
    route.includes("filename*=UTF-8''"), true);
  check('with an ASCII fallback for clients that cannot read it',
    route.includes("replace(/[^\\x20-\\x7E]/g, '_')"), true);
  // Unescaped, a newline in a filename would let the uploader write headers.
  check('and is stripped of header characters first',
    route.includes('replace(/["\\\\\\r\\n]/g'), true);

  // Nothing may link straight at a blob any more, or the route is decoration.
  check('the attendee page links through the route',
    form.includes('/api/submission-files/') && !form.includes('href={file.url}'), true);
  check('and so does the review page',
    review.includes('/api/submission-files/') && !review.includes('href={f.url}'), true);
}

// --- numbers, in one script --------------------------------------------------
//
// An Arabic keyboard types ٧٧٠…, which is the same number to a person and
// unusable to everything else: it cannot be dialled from a contacts app, found
// by somebody searching in Latin, or sorted in an exported spreadsheet.

{
  const { toLatinDigits, normalizePhone } = await import('../lib/digits');

  check('Arabic-Indic digits become Latin', toLatinDigits('٧٧٠١٢٣٤٥٦'), '770123456');
  check('and the Eastern set too', toLatinDigits('۷۷۰۱۲۳۴۵۶'), '770123456');
  check('Latin digits are left alone', toLatinDigits('770123456'), '770123456');
  check('a mixed number is fully converted', toLatinDigits('+٩٦٧ 770 ١٢٣٤٥٦'), '+967 770 123456');

  // Only the digits change. How somebody writes their own number is theirs.
  check('the plus and spacing survive', normalizePhone('+٩٦٧ ٧٧٠ ١٢٣ ٤٥٦'), '+967 770 123 456');
  check('and so do dashes', normalizePhone('٠٧٧٠-١٢٣-٤٥٦'), '0770-123-456');

  // Invisible in every interface, and enough to break an exact-match search.
  check('bidi marks are stripped', normalizePhone('\u200F+967\u200E 770123456'), '+967 770123456');
  check('Arabic separators are stripped', normalizePhone('٧٧٠٫١٢٣٬٤٥٦'), '770123456');
  check('nothing at all is empty', [normalizePhone(''), normalizePhone(null)], ['', '']);

  // Every path that writes a phone number goes through it — the public form is
  // only one of the things that can reach the route.
  const register = readFileSync('app/api/register/route.ts', 'utf8');
  const form = readFileSync('components/sections/RegisterForm.tsx', 'utf8');
  const walkIn = readFileSync('lib/walk-in.ts', 'utf8');
  const account = readFileSync('app/dashboard/account/actions.ts', 'utf8');
  const users = readFileSync('app/admin/(panel)/users/actions.ts', 'utf8');

  check('the form converts as it is typed', form.includes('toLatinDigits(e.target.value)'), true);
  // A way out at the top as well as the foot: somebody who opened the form and
  // wanted to read about the conference first should not have to scroll past
  // every field to leave.
  check('and offers a way back to the site before the form',
    form.indexOf('backToSite') < form.indexOf('{p.title}'), true);
  // Right-to-left text would otherwise reorder a number on screen. Measured on
  // the element itself rather than a window of characters around it, so a
  // comment added above the attribute cannot break the check.
  const phoneInput = form.slice(form.indexOf('type="tel"'), form.indexOf('/>', form.indexOf('type="tel"')));
  check('and the field reads left to right', phoneInput.includes('dir="ltr"'), true);
  check('the registration route normalises', register.includes('transform(normalizePhone)'), true);
  check('the door desk normalises', walkIn.includes('normalizePhone(input.phone)'), true);
  check('the account page normalises', account.includes('normalizePhone('), true);
  check('and the organizer forms normalise', users.includes('normalizePhone('), true);
}

// --- light or dark, and who decided --------------------------------------------
//
// The site opened dark for everybody and only went light if somebody had asked
// for it explicitly. On a phone in daylight with the OS set to light, that is a
// page ignoring what its owner already told their device.

{
  const layout = readFileSync('app/layout.tsx', 'utf8');
  const context = readFileSync('lib/theme-context.tsx', 'utf8');
  const shell = readFileSync('components/platform/PlatformShell.tsx', 'utf8');
  const auth = readFileSync('components/platform/AuthScreen.tsx', 'utf8');
  const form = readFileSync('components/sections/RegisterForm.tsx', 'utf8');

  // The absence of a stored preference means "follow this device", not "dark".
  check('no preference means follow the device',
    context.includes("? stored : 'system'"), true);
  check('and the system is read from the media query',
    context.includes("matchMedia?.('(prefers-color-scheme: light)')"), true);
  // Somebody whose phone switches at sunset should not have to reload.
  check('and followed live while in that mode',
    context.includes("query.addEventListener('change', sync)"), true);

  // Applied from an effect, the correct theme arrives after the first paint —
  // so a light-mode visitor watches a dark page flip. This has to be in <head>.
  check('the theme is stamped before the first paint',
    layout.includes("document.documentElement.setAttribute('data-theme'"), true);
  check('by a script in the document head',
    layout.indexOf('<head>') < layout.indexOf('prefers-color-scheme'), true);
  // The two decide the same thing and must not drift.
  check('reading the same key as the provider',
    layout.includes("localStorage.getItem('cic-theme')")
      && context.includes('THEME_STORAGE_KEY'), true);
  // Blocked site data throws on read; an unreadable preference is not a crash.
  check('and surviving unreadable storage',
    layout.includes('}catch(e){'), true);

  // The bug this is here for: the provider starts at the 'system' default, so
  // on the first client render the follow-the-device effect ran and stamped
  // data-theme from the media query — painting over the choice the blocking
  // script had correctly read from storage a moment earlier. By the time the
  // real preference arrived in state, that effect returned early and nothing
  // else wrote the attribute, so an explicit "light" on a dark device stayed
  // dark. Every check above passed throughout.
  //
  // So: one writer, downstream of the resolved theme, and silent until the
  // stored preference has actually been read.
  const applyCalls = (context.match(/(?<!function )\bapply\(/g) ?? []).length;
  check('one place writes data-theme', applyCalls, 1);
  check('and it is an effect on the resolved theme',
    context.includes('if (read) apply(theme);')
      && context.includes('}, [read, theme]);'), true);
  check('and nothing paints before the preference is read',
    context.includes('if (!read || mode !== ') && context.includes('setRead(true)'), true);

  // 'system' is stored rather than cleared, so "follow the device" is a
  // decision somebody made and not merely the absence of one.
  check('choosing auto is remembered',
    context.includes('localStorage.setItem(THEME_STORAGE_KEY, next)'), true);
  check('and the panels offer the way back to it',
    shell.includes("dark: 'system'"), true);

  // These screens carry no site header, so without this the only way out of a
  // sign-in page is the browser's back button.
  check('the sign-in screens offer a way back to the site',
    auth.includes('العودة إلى الموقع'), true);
  check('and so does the registration form', form.includes('backToSite'), true);
}

// --- undo --------------------------------------------------------------------

await prisma.notification.deleteMany({ where: { title: marker } });
await prisma.announcement.deleteMany({ where: { title: marker } });
// Counted by marker, not as a global total.
//
// This compared the whole Notification table before and after, which held
// while the platform was empty and stopped the moment it went live: a real
// registration approved by an organizer mid-run is a row this script did not
// write and must not be blamed for. What has to be true is that nothing
// *carrying the marker* survives.
check('test data removed', await prisma.notification.count({ where: { title: marker } }), 0);
check('and no announcement either', await prisma.announcement.count({ where: { title: marker } }), 0);

await prisma.$disconnect();
console.log(failures === 0 ? '\nall checks passed' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
