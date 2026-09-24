import { notFound } from 'next/navigation';
import { Lock, MessageSquareQuote } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import FormShell from '@/components/admin/FormShell';
import StatusChip from '@/components/submissions/StatusChip';
import SubmissionFields from '../SubmissionFields';
import { updateSubmission } from '../actions';
import { innovationAccess, NotEntitled } from '../access';

export default async function EditSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const access = await innovationAccess();
  if (access.userId === null) return <NotEntitled category={access.category} />;

  // Scoped by userId: another attendee's submission is a 404 here, exactly
  // like an id that does not exist — no way to probe for someone else's work.
  const submission = await prisma.projectSubmission.findFirst({
    where: { id, userId: access.userId },
    include: { files: { orderBy: { createdAt: 'asc' } } },
  });
  if (!submission) notFound();

  const locked = submission.status !== 'DRAFT';
  const action = updateSubmission.bind(null, id);

  return (
    <FormShell
      title={locked ? 'عرض المشروع' : 'تعديل المشروع'}
      backHref="/dashboard/innovations"
      action={action}
      submitLabel="حفظ التعديلات"
    >
      <div className="flex items-center gap-2">
        <span className="text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>الحالة</span>
        <StatusChip status={submission.status} />
      </div>

      {locked && (
        <div
          className="flex items-start gap-2.5 rounded-xl p-4"
          style={{
            background: 'var(--mat-liquid-bg)',
            border: '1px solid var(--mat-liquid-border)',
            borderInlineStartWidth: '3px',
            borderInlineStartColor: 'var(--accent-blue)',
          }}
        >
          <Lock className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--accent-blue)' }} />
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            هذا المشروع لدى لجنة المراجعة، ولم يعد التعديل عليه ممكناً. تواصل مع اللجنة إذا احتجت إلى تغيير.
          </p>
        </div>
      )}

      {submission.reviewNote && (
        <div
          className="rounded-xl p-4"
          style={{
            background: 'var(--mat-liquid-bg)',
            border: '1px solid var(--mat-liquid-border)',
            borderInlineStartWidth: '3px',
            borderInlineStartColor: 'var(--accent-violet)',
          }}
        >
          <p
            className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-bold"
            style={{ color: 'var(--accent-violet)' }}
          >
            <MessageSquareQuote className="h-3.5 w-3.5" />
            ملاحظات لجنة المراجعة
          </p>
          <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>
            {submission.reviewNote}
          </p>
        </div>
      )}

      <SubmissionFields
        submission={submission}
        files={submission.files.map((f) => ({
          id: f.id, name: f.name, sizeBytes: f.sizeBytes,
        }))}
        editable={!locked}
      />
    </FormShell>
  );
}
