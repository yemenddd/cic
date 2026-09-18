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
