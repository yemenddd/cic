import type { SubmissionStatus } from '@prisma/client';

// Arabic labels for SubmissionStatus — shared by the attendee dashboard and
// the admin review queue so one status never reads two different ways.
export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  DRAFT: 'مسودة',
  PENDING: 'قيد الانتظار',
  UNDER_REVIEW: 'قيد المراجعة',
  APPROVED: 'مقبول',
  REJECTED: 'مرفوض',
};

// Only CSS custom properties — the accent/destructive tokens are defined for
// both the light and dark themes, so the chips stay legible in either.
export const SUBMISSION_STATUS_COLORS: Record<SubmissionStatus, string> = {
  DRAFT: 'var(--text-tertiary)',
  PENDING: 'var(--accent-blue)',
  UNDER_REVIEW: 'var(--accent-violet)',
  APPROVED: 'var(--accent-cyan)',
  REJECTED: 'var(--destructive)',
};

export const SUBMISSION_STATUSES: SubmissionStatus[] = [
  'DRAFT',
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
];

// The statuses the committee may set. DRAFT and PENDING are owned by the
// attendee's own flow, so the review form must not be able to reach them.
export const REVIEW_STATUSES: SubmissionStatus[] = ['UNDER_REVIEW', 'APPROVED', 'REJECTED'];

export function isSubmissionStatus(value: string): value is SubmissionStatus {
  return (SUBMISSION_STATUSES as string[]).includes(value);
}

/**
 * The two paths a participant takes part through.
 *
 * There were four topical tracks; a participant now declares which of two
 * kinds of work they are bringing, because that is the distinction the review
 * committee actually splits on — a prototype is judged differently from a
 * paper. The four became these two in the migration that introduced them.
 */
export const SUBMISSION_TRACKS = [
  'مسار الاختراع والابتكار',
  'مسار البحث العلمي',
];

/**
 * The same two paths as the public registration form offers them, in each
 * language it is offered in — in the same order as SUBMISSION_TRACKS above.
 *
 * The form posts whatever label the visitor saw, so somebody registering with
 * the site in English sent "Innovation & Technology" and that is what was
 * stored. It then appeared, in English, on an Arabic certificate — and the
 * account page's own track list did not contain it, so the value could never
 * be re-selected either.
 *
 * Kept here beside the canonical list rather than read from lib/dictionary.ts:
 * that module is the marketing copy and is edited freely, and a wording change
 * there must not quietly start rejecting registrations.
 */
const TRACK_LABELS: string[][] = [
  ['Invention & Innovation Path', 'İcat ve İnovasyon Yolu'],
  ['Scientific Research Path', 'Bilimsel Araştırma Yolu'],
];

/**
 * The four tracks this replaced, and where each one lands.
 *
 * Kept rather than deleted for two reasons: a form served from a cached page
 * or a stale tab still posts the old label, and an account whose value has not
 * been migrated yet must not be refused when its owner edits their profile.
 * Research keeps its own path; everything that described making a thing
 * becomes the invention path — which is the mapping the migration applied to
 * the stored rows.
 */
const LEGACY_TRACKS: Record<string, string> = {
  'الابتكار والتقنية': SUBMISSION_TRACKS[0],
  'الذكاء الاصطناعي والروبوتات': SUBMISSION_TRACKS[0],
  'ريادة الأعمال': SUBMISSION_TRACKS[0],
  'البحث العلمي': SUBMISSION_TRACKS[1],
  'innovation & technology': SUBMISSION_TRACKS[0],
  'ai & robotics': SUBMISSION_TRACKS[0],
  'entrepreneurship': SUBMISSION_TRACKS[0],
  'scientific research': SUBMISSION_TRACKS[1],
  'i̇novasyon ve teknoloji': SUBMISSION_TRACKS[0],
  'yapay zeka ve robotik': SUBMISSION_TRACKS[0],
  'girişimcilik': SUBMISSION_TRACKS[0],
  'bilimsel araştırma': SUBMISSION_TRACKS[1],
};

/**
 * The canonical Arabic path for a label in any of the three languages.
 *
 * Returns '' for an empty value, which is a real answer — the path is optional
 * for a visitor — and null for anything that is neither one of the current six
 * spellings nor one of the retired ones, which is what an invented value looks
 * like.
 */
export function canonicalTrack(raw: string | null | undefined): string | null {
  const value = (raw ?? '').trim();
  if (!value) return '';

  const direct = SUBMISSION_TRACKS.indexOf(value);
  if (direct !== -1) return SUBMISSION_TRACKS[direct];

  const lower = value.toLowerCase();
  for (let i = 0; i < TRACK_LABELS.length; i++) {
    if (TRACK_LABELS[i].some((l) => l.toLowerCase() === lower)) return SUBMISSION_TRACKS[i];
  }

  return LEGACY_TRACKS[value] ?? LEGACY_TRACKS[lower] ?? null;
}

/**
 * May this attendee store this track?
 *
 * The track is printed on the certificate, so it is chosen from the list above
 * rather than typed — but an account whose stored track predates that list
 * must not have it silently dropped when they edit anything else on the page.
 * Their own current value is therefore always allowed, and so is clearing it.
 */
export function isTrackAllowed(track: string, currentTrack: string | null): boolean {
  return track === '' || SUBMISSION_TRACKS.includes(track) || track === currentTrack;
}
