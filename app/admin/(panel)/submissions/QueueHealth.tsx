import Link from 'next/link';
import { Inbox, Clock, CircleCheck, FileEdit, TriangleAlert } from 'lucide-react';
import type { QueueHealth as Health } from '@/lib/submission-queue';
import { arabicCount, arabicCountBare, PROJECT, DAY } from '@/lib/arabic-plural';

/**
 * The state of the review queue, above the list.
 *
 * The page was a filtered table, which answers "what is in each status" and
 * not the question a committee actually opens it with: is anybody waiting on
 * us, and for how long. Four figures, and a warning when the answer to the
 * second one is embarrassing.
 *
 * Drafts are counted separately and deliberately. They are somebody's
 * unfinished work, not a queue the committee is behind on — folding them into
 * "outstanding" would make the panel look permanently in arrears over projects
 * nobody has submitted.
 */

function Figure({
  icon: Icon,
  value,
  label,
  color,
  href,
}: {
  icon: typeof Inbox;
  value: string | number;
  label: string;
  color: string;
  href?: string;
}) {
  const body = (
    <>
      <span
        className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: 'var(--mat-liquid-bg)' }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </span>
      <span
        className="block font-outfit font-bold text-[20px] leading-none tabular-nums"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </span>
      <span className="mt-1.5 block text-[11.5px] leading-snug" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </span>
    </>
  );

  const className = 'rounded-2xl p-4';
  const style = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--mat-liquid-border)',
  } as const;

  return href ? (
    <Link href={href} className={`platform-activity-row ${className}`} style={style}>
      {body}
    </Link>
  ) : (
    <div className={className} style={style}>
      {body}
    </div>
  );
}

export default function QueueHealth({ health }: { health: Health }) {
  const { awaiting, oldestWaitDays, overdue, decided, drafts } = health;

  // Nothing has ever been submitted. A row of zeros would say less than the
  // empty state the table already shows.
  if (awaiting + decided + drafts === 0) return null;

  return (
    <div className="mb-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Figure
          icon={Inbox}
          value={awaiting}
          label="بانتظار قراركم"
          color="var(--accent-blue)"
          href="/admin/submissions?status=PENDING"
        />
        <Figure
          icon={Clock}
          value={awaiting > 0 ? arabicCountBare(oldestWaitDays, DAY) : '—'}
          label="أطول انتظار"
          color={overdue > 0 ? 'var(--destructive)' : 'var(--accent-violet)'}
        />
        <Figure
          icon={CircleCheck}
          value={decided}
          label="صدر فيها قرار"
          color="var(--accent-cyan)"
          href="/admin/submissions?status=APPROVED"
        />
        <Figure
          icon={FileEdit}
          value={drafts}
          label="مسودات لدى أصحابها"
          color="var(--text-tertiary)"
          href="/admin/submissions?status=DRAFT"
        />
      </div>

      {/* Only when there is something to say. A banner that is always present
          is furniture, and stops being read within a day. */}
      {overdue > 0 && (
        <p
          className="mt-3 flex items-start gap-2.5 rounded-xl p-3.5 text-[12.5px] leading-relaxed"
          style={{
            background: 'color-mix(in srgb, var(--destructive) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--destructive) 28%, transparent)',
            color: 'var(--text-secondary)',
          }}
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--destructive)' }} />
          {/* Counted through the shared helper rather than by hand. Arabic has
              four forms and 11+ takes the singular accusative, so "15 مشاريع"
              — which is what writing it inline produced — is wrong, and the
              pronoun after it has to agree too. */}
          <span>
            {arabicCount(overdue, PROJECT)} {overdue === 1 ? 'ينتظر' : 'تنتظر'} أكثر من أسبوعين.
            {overdue === 1 ? ' صاحبه لا يعرف' : ' أصحابها لا يعرفون'} إن كان قد وصل أصلاً.
          </span>
        </p>
      )}
    </div>
  );
}
