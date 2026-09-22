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

// Mirrors the track options offered on the public registration form.
export const SUBMISSION_TRACKS = [
  'الابتكار والتقنية',
  'الذكاء الاصطناعي والروبوتات',
  'البحث العلمي',
  'ريادة الأعمال',
];

/**
 * The same four tracks as the public registration form offers them, in each
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
  ['Innovation & Technology', 'İnovasyon ve Teknoloji'],
  ['AI & Robotics', 'Yapay Zeka ve Robotik'],
  ['Scientific Research', 'Bilimsel Araştırma'],
  ['Entrepreneurship', 'Girişimcilik'],
];

/**
 * The canonical Arabic track for a label in any of the three languages.
 *
 * Returns '' for an empty value, which is a real answer — the track is
 * optional — and null for anything that is not one of the twelve, which is
 * what an invented value looks like.
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
  return null;
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
