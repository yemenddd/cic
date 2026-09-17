// iCalendar (RFC 5545) generation for an attendee's saved program sessions.
//
// ─── ASSUMPTIONS ENCODED HERE (read before changing the conference dates) ───
// ProgramSession stores NO date and NO end time. It has `day` ('dayOne' |
// 'dayTwo') and `time`, a free-text display string like '09:00'. Turning that
// into real calendar events therefore requires three assumptions that live
// nowhere in the schema and will silently produce wrong events if the
// conference moves:
//
//   1. CICT 2026 runs 15–16 August 2026, so 'dayOne' → 2026-08-15 and
//      'dayTwo' → 2026-08-16. Update DAY_DATES below if the dates change.
//   2. The venue is Istanbul, which is UTC+3 all year (Türkiye abolished DST in
//      2016), so local 09:00 is emitted as 060000Z. Because the offset is
//      fixed we can write plain UTC stamps and skip a VTIMEZONE block
//      entirely. If Türkiye ever reintroduces DST this becomes wrong for one
//      half of the year.
//   3. There is no end time anywhere, so each session is assumed to last
//      DEFAULT_DURATION_MINUTES (60). When `time` happens to contain a range
//      ('09:00 - 10:30') we use the second time as the real end instead.
//
// If `time` can't be parsed at all we emit an all-day event for the right day
// rather than guessing a clock time or emitting a malformed DTSTART — a
// calendar app rejects a broken file silently, so degrading is safer.

export type IcsSession = {
  id: string;
  day: string;
  time: string;
  titleAr: string;
  speakerNameAr?: string | null;
  speakerRoleAr?: string | null;
  trackAr?: string | null;
};

const DAY_DATES: Record<string, { y: number; m: number; d: number }> = {
  dayOne: { y: 2026, m: 8, d: 15 },
  dayTwo: { y: 2026, m: 8, d: 16 },
};

const ISTANBUL_UTC_OFFSET_HOURS = 3;
const DEFAULT_DURATION_MINUTES = 60;
const LOCATION_AR = 'إسطنبول، تركيا';

/** RFC 5545 §3.3.11: backslash, semicolon and comma are escaped; newlines become \n. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * RFC 5545 §3.1 content-line folding: lines are limited to 75 OCTETS, not 75
 * characters, and a multi-octet character must never be split across the fold.
 * Arabic is 2 bytes per letter in UTF-8, so folding on `String.length` would
 * cut characters in half and corrupt every title. We fold on the UTF-8 byte
 * array and back off any continuation byte (0b10xxxxxx) before cutting.
 * Continuation lines start with one space, which itself costs an octet.
 */
function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const decoder = new TextDecoder();
  const parts: string[] = [];
  let start = 0;
  let limit = 75;

  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    while (end > start + 1 && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end -= 1;
    parts.push(decoder.decode(bytes.subarray(start, end)));
    start = end;
    limit = 74; // the leading space of a continuation line eats one octet
  }

  return parts.join('\r\n ');
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Format a Date as an RFC 5545 UTC date-time: 20260815T060000Z. */
export function formatUtcStamp(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function formatDateOnly(y: number, m: number, d: number): string {
  return `${y}${pad(m)}${pad(d)}`;
}

/**
 * Pull clock times out of the free-text `time` column. Tolerates Arabic-Indic
 * digits, '.' as a separator, and AM/PM markers in either script; returns every
 * time it finds so a '09:00 - 10:30' range can supply a real end time.
 */
function parseTimes(raw: string): { hour: number; minute: number }[] {
  // Normalise Arabic-Indic (٠-٩) and Eastern Arabic-Indic (۰-۹) digits to ASCII.
  const normalised = raw.replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0));

  const out: { hour: number; minute: number }[] = [];
  const re = /(\d{1,2})\s*[:.]\s*(\d{2})\s*(am|pm|ص|م)?/gi;

  for (const match of normalised.matchAll(re)) {
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const marker = match[3]?.toLowerCase();

    if (!Number.isFinite(hour) || !Number.isFinite(minute)) continue;
    if (minute > 59) continue;

    if (marker === 'pm' || marker === 'م') {
      if (hour >= 1 && hour <= 11) hour += 12;
    } else if (marker === 'am' || marker === 'ص') {
      if (hour === 12) hour = 0;
    }

    if (hour > 23) continue;
    out.push({ hour, minute });
  }

  return out;
}

/** A session resolved to a real UTC interval. */
export type SessionInterval = { start: Date; end: Date };

/**
 * Resolve a session's `day` + free-text `time` into a real UTC interval, using
 * the exact same DAY_DATES table, time parser, Istanbul offset and
 * DEFAULT_DURATION_MINUTES fallback the .ics export uses.
 *
 * Returns null when the day is unknown or the time can't be parsed at all —
 * i.e. exactly the cases where the .ics falls back to an all-day event or drops
 * the session. Callers must treat null as "unknown time" and never guess: the
 * clash detector in lib/agenda.ts depends on that to avoid false alarms.
 *
 * Exported so the calendar export and the agenda clash detector can never
 * disagree about when a session starts.
 */
export function resolveSessionInterval(session: {
  day: string;
  time?: string | null;
}): SessionInterval | null {
  const date = DAY_DATES[session.day];
  if (!date) return null;

  const times = parseTimes(session.time ?? '');
  if (times.length === 0) return null;

  // Local Istanbul wall-clock → UTC by subtracting the fixed +03:00 offset.
  const start = new Date(
    Date.UTC(date.y, date.m - 1, date.d, times[0].hour - ISTANBUL_UTC_OFFSET_HOURS, times[0].minute),
  );

  let end = new Date(start.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);
  if (times.length > 1) {
    const candidate = new Date(
      Date.UTC(date.y, date.m - 1, date.d, times[1].hour - ISTANBUL_UTC_OFFSET_HOURS, times[1].minute),
    );
    if (candidate.getTime() > start.getTime()) end = candidate;
  }

  return { start, end };
}

function buildDescription(session: IcsSession): string {
  const lines: string[] = [];

  // Either half may be missing in the data, so neither is allowed to swallow
  // the other.
  if (session.speakerNameAr && session.speakerRoleAr) {
    lines.push(`${session.speakerNameAr} — ${session.speakerRoleAr}`);
  } else if (session.speakerNameAr || session.speakerRoleAr) {
    lines.push(session.speakerNameAr || session.speakerRoleAr || '');
  }
  if (session.trackAr) lines.push(`المسار: ${session.trackAr}`);

  return lines.join('\n');
}

function eventLines(session: IcsSession, dtstamp: string): string[] {
  const date = DAY_DATES[session.day];
  // An unknown `day` value has no date to anchor the event to, and a VEVENT
  // without a DTSTART is invalid — drop the session rather than emit garbage.
  if (!date) return [];

  const lines: string[] = ['BEGIN:VEVENT'];

  // UID must be stable across exports so re-importing updates the event instead
  // of duplicating it.
  lines.push(`UID:${escapeText(session.id)}@cict2026`);
  lines.push(`DTSTAMP:${dtstamp}`);

  // `date` is known here, so a null interval means only one thing: the time
  // itself was unparseable.
  const interval = resolveSessionInterval(session);

  if (!interval) {
    // Unparseable time: an honest all-day event on the right date beats a
    // guessed clock time or a malformed DTSTART. DTEND is exclusive, so it is
    // the following day.
    const startUtc = Date.UTC(date.y, date.m - 1, date.d);
    const next = new Date(startUtc + 24 * 60 * 60 * 1000);
    lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(date.y, date.m, date.d)}`);
    lines.push(
      `DTEND;VALUE=DATE:${formatDateOnly(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate())}`,
    );
  } else {
    lines.push(`DTSTART:${formatUtcStamp(interval.start)}`);
    lines.push(`DTEND:${formatUtcStamp(interval.end)}`);
  }

  lines.push(`SUMMARY:${escapeText(session.titleAr || 'جلسة')}`);

  const description = buildDescription(session);
  if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);

  lines.push(`LOCATION:${escapeText(LOCATION_AR)}`);
  lines.push('END:VEVENT');

  return lines;
}

/** Build the full .ics document. Lines are folded and joined with CRLF. */
export function buildAgendaIcs(sessions: IcsSession[], now: Date = new Date()): string {
  const dtstamp = formatUtcStamp(now);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CICT//Creativity & Innovation Conference 2026//AR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText('جدولي — مؤتمر الإبداع والابتكار 2026')}`,
    'X-WR-TIMEZONE:Europe/Istanbul',
  ];

  for (const session of sessions) {
    lines.push(...eventLines(session, dtstamp));
  }

  lines.push('END:VCALENDAR');

  return lines.map(foldLine).join('\r\n') + '\r\n';
}
