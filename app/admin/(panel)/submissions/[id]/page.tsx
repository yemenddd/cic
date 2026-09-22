import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Video, FileText } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import FormShell from '@/components/admin/FormShell';
import { SelectField, TextAreaField } from '@/components/admin/fields';
import StatusChip from '@/components/submissions/StatusChip';
import { REVIEW_STATUSES, SUBMISSION_STATUS_LABELS } from '@/lib/submissions';
import { reviewSubmission } from '../actions';

function Field({ label, value, dir }: { label: string; value?: string | null; dir?: 'ltr' | 'rtl' }) {
  return (
    <div>
      <p className="mb-1 text-[11.5px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p
        className="text-[13.5px] leading-relaxed whitespace-pre-line"
        style={{ color: 'var(--text-primary)' }}
        dir={dir}
      >
        {value || '—'}
      </p>
    </div>
  );
}

export default async function AdminSubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const submission = await prisma.projectSubmission.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, organization: true, country: true } },
      files: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!submission) notFound();

  const action = reviewSubmission.bind(null, id);

  const statusOptions = REVIEW_STATUSES.map((s) => ({ value: s, label: SUBMISSION_STATUS_LABELS[s] }));
  const defaultStatus = REVIEW_STATUSES.includes(submission.status) ? submission.status : 'UNDER_REVIEW';

  return (
    <FormShell
      title={submission.titleAr}
      backHref="/admin/submissions"
      action={action}
      submitLabel="حفظ قرار اللجنة"
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip status={submission.status} />
        <span className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
          {submission.submittedAt
            ? `أُرسل في ${new Date(submission.submittedAt).toLocaleDateString('ar')}`
            : 'لم يُرسل بعد'}
          {submission.reviewedAt
            ? ` · روجع في ${new Date(submission.reviewedAt).toLocaleDateString('ar')}`
            : ''}
        </span>
      </div>

      {submission.coverImageUrl && (
        <div
          className="overflow-hidden rounded-xl"
          style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <Image
            src={submission.coverImageUrl}
            alt=""
            width={800}
            height={450}
            className="h-auto w-full object-cover"
            unoptimized
          />
        </div>
      )}

      <div
        className="grid grid-cols-1 gap-4 rounded-xl p-4 sm:grid-cols-2"
        style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
      >
        <Field label="مقدّم المشروع" value={submission.user.name} />
        <Field label="البريد الإلكتروني" value={submission.user.email} dir="ltr" />
        <Field label="الجهة" value={submission.user.organization} />
        <Field label="الدولة" value={submission.user.country} />
      </div>

      <Field label="العنوان بالإنجليزية" value={submission.titleEn} dir="ltr" />
      <Field label="الملخص" value={submission.summaryAr} />
      <Field label="الوصف التفصيلي" value={submission.descriptionAr} />
      <Field label="المسار" value={submission.track} />
      <Field
        label="أعضاء الفريق"
        value={submission.teamMembers.length ? submission.teamMembers.join('\n') : null}
      />

      {/* The work itself. A committee that cannot open the paper is reviewing
          the summary of it, which is not the same thing — and until now there
          was nowhere for a paper to be attached at all. */}
      <div>
        <p className="mb-1.5 text-[11.5px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
          ملفات المشروع
        </p>
        {submission.files.length === 0 ? (
          <p className="text-[13.5px]" style={{ color: 'var(--text-primary)' }}>—</p>
        ) : (
          <ul className="space-y-2">
            {submission.files.map((f) => (
              <li key={f.id}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                  style={{
                    background: 'var(--mat-liquid-bg)',
                    border: '1px solid var(--mat-liquid-border)',
                  }}
                >
                  <FileText className="h-4 w-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  <span
                    className="min-w-0 flex-1 truncate text-[13px] font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {f.name}
                  </span>
                  <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                    {Math.max(1, Math.round(f.sizeBytes / 1024))} ك.ب
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-1 text-[11.5px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>فيديو المشروع</p>
        {submission.videoId ? (
          <a
            href={`https://www.youtube.com/watch?v=${submission.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold"
            style={{ color: 'var(--accent-cyan)' }}
            dir="ltr"
          >
            <Video className="h-4 w-4" />
            {submission.videoId}
          </a>
        ) : (
          <p className="text-[13.5px]" style={{ color: 'var(--text-primary)' }}>—</p>
        )}
      </div>

      <div className="pt-4 space-y-5" style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
        <h2 className="font-outfit font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
          قرار لجنة المراجعة
        </h2>
        <SelectField name="status" label="الحالة" defaultValue={defaultStatus} options={statusOptions} />
        <TextAreaField
          name="reviewNote"
          label="ملاحظات اللجنة (تظهر لصاحب المشروع)"
          defaultValue={submission.reviewNote}
        />
      </div>
    </FormShell>
  );
}
