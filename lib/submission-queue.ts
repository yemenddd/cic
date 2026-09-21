import type { SubmissionStatus } from '@prisma/client';

/**
 * A review queue, read from both ends.
 *
 * The committee's list showed a status chip and a submission date, and the
 * attendee's list showed the same chip. Neither answered the question each
 * side actually has: for the committee, which of these has been waiting
 * longest and is that too long; for the attendee, what does "قيد المراجعة"
 * mean and is there anything to do about it.
 *
 * Pure, so the same reckoning serves both pages and can be checked.
 */

/** Statuses that are waiting on the committee rather than on the attendee. */
export const AWAITING_REVIEW: SubmissionStatus[] = ['PENDING', 'UNDER_REVIEW'];

/** A decision has been made and the attendee has been answered. */
export const DECIDED: SubmissionStatus[] = ['APPROVED', 'REJECTED'];

export type WaitLevel = 'fresh' | 'aging' | 'overdue';

export interface Waiting {
  days: number;
  level: WaitLevel;
  label: string;
}

/**
 * How long something has been sitting unanswered.
 *
 * The thresholds are a promise, not a measurement: a week is the point at
 * which somebody who submitted a project starts wondering whether it arrived,
 * and two is the point at which not answering is itself an answer. They exist
 * so the queue can be sorted by conscience rather than by date.
 */
const AGING_DAYS = 7;
const OVERDUE_DAYS = 14;

export function waitingSince(submittedAt: Date | null, now: Date = new Date()): Waiting | null {
  if (!submittedAt) return null;

  const ms = now.getTime() - submittedAt.getTime();
  // A clock skew, or a row written a moment ago. Not negative days.
  const days = Math.max(0, Math.floor(ms / 86_400_000));

  const level: WaitLevel = days >= OVERDUE_DAYS ? 'overdue' : days >= AGING_DAYS ? 'aging' : 'fresh';

  const label =
    days === 0 ? 'اليوم'
      : days === 1 ? 'منذ يوم'
        : days === 2 ? 'منذ يومين'
          : days <= 10 ? `منذ ${days} أيام`
            : `منذ ${days} يوماً`;

  return { days, level, label };
}

export const WAIT_COLORS: Record<WaitLevel, string> = {
  fresh: 'var(--text-tertiary)',
  aging: 'var(--accent-violet)',
  overdue: 'var(--destructive)',
};

export interface QueueHealth {
  /** Waiting on the committee. */
  awaiting: number;
  /** Of those, how long the one that has waited longest has waited. */
  oldestWaitDays: number;
  /** Of those, how many are past the overdue threshold. */
  overdue: number;
  /** Decided, ever. */
  decided: number;
  /** Still a draft in its author's hands — not the committee's to answer. */
  drafts: number;
}

/**
 * The state of the queue, from the rows themselves.
 *
 * Counted from a projection rather than several aggregate queries: the numbers
 * have to agree with each other, and three separate counts taken a moment
 * apart do not.
 */
export function queueHealth(
  rows: Array<{ status: SubmissionStatus; submittedAt: Date | null }>,
  now: Date = new Date(),
): QueueHealth {
  let awaiting = 0;
  let overdue = 0;
  let decided = 0;
  let drafts = 0;
  let oldestWaitDays = 0;

  for (const row of rows) {
    if (row.status === 'DRAFT') {
      drafts++;
      continue;
    }
    if (DECIDED.includes(row.status)) {
      decided++;
      continue;
    }
    if (AWAITING_REVIEW.includes(row.status)) {
      awaiting++;
      const wait = waitingSince(row.submittedAt, now);
      if (wait) {
        oldestWaitDays = Math.max(oldestWaitDays, wait.days);
        if (wait.level === 'overdue') overdue++;
      }
    }
  }

  return { awaiting, oldestWaitDays, overdue, decided, drafts };
}

export interface StatusGuidance {
  /** What this state actually means, in the attendee's terms. */
  meaning: string;
  /** What they should do, or null when the answer is "nothing, wait". */
  next: string | null;
  /** Whether the ball is in their court. */
  actionable: boolean;
}

/**
 * What a status means to the person who submitted it.
 *
 * A chip reading "قيد المراجعة" tells somebody the name of a state, not what
 * it means for them or whether they are supposed to do something. The
 * difference matters most for DRAFT, which looks submitted and is not — the
 * commonest way to miss a deadline is to believe you have already met it.
 */
export function statusGuidance(status: SubmissionStatus): StatusGuidance {
  switch (status) {
    case 'DRAFT':
      return {
        meaning: 'محفوظ عندك فقط — لم تره اللجنة بعد.',
        next: 'أرسله للمراجعة حين يكون جاهزاً. المسودة لا تُراجَع.',
        actionable: true,
      };
    case 'PENDING':
      return {
        meaning: 'وصل إلى اللجنة وهو في الطابور.',
        next: null,
        actionable: false,
      };
    case 'UNDER_REVIEW':
      return {
        meaning: 'اللجنة تقرؤه الآن.',
        next: null,
        actionable: false,
      };
    case 'APPROVED':
      return {
        meaning: 'قُبل مشروعك للعرض في المؤتمر.',
        next: 'راجع ملاحظات اللجنة إن وُجدت، وجهّز عرضك.',
        actionable: true,
      };
    case 'REJECTED':
      return {
        meaning: 'لم يُقبل هذه المرة.',
        next: 'اقرأ ملاحظة اللجنة — فيها سبب القرار وما يمكن تحسينه.',
        actionable: true,
      };
    default:
      // Unreachable while the enum is what it is. Kept so that adding a status
      // to the schema and forgetting this file produces a neutral line rather
      // than an undefined the page renders as a blank paragraph.
      return { meaning: '', next: null, actionable: false };
  }
}
