import Image from 'next/image';
import Link from 'next/link';
import { Lightbulb, MessageSquareQuote, Pencil, Plus } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import StatusChip from '@/components/submissions/StatusChip';
import DeleteButton from '@/components/admin/DeleteButton';
import SubmitForReviewButton from './SubmitForReviewButton';
import { deleteSubmission } from './actions';
import { innovationAccess, NotEntitled } from './access';

export default async function DashboardInnovationsPage() {
  const access = await innovationAccess();
  if (access.userId === null) return <NotEntitled category={access.category} />;

  const submissions = await prisma.projectSubmission.findMany({
    where: { userId: access.userId },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
          ابتكاراتي
        </h1>
        <Link
          href="/dashboard/innovations/new"
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <Plus className="h-4 w-4" />
          تقديم ابتكار
        </Link>
      </div>

      {submissions.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-14 text-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'var(--mat-liquid-bg)' }}
          >
            <Lightbulb className="h-6 w-6" style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <p className="font-outfit font-bold text-[15px] mb-2" style={{ color: 'var(--text-primary)' }}>
            لم تقدّم أي ابتكار بعد
          </p>
          <p className="text-[13px] mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
            شارك فكرتك أو مشروعك مع لجنة المؤتمر. احفظه كمسودة، عدّله كما تشاء، ثم أرسله للمراجعة حين يكون جاهزاً.
          </p>
          <Link
            href="/dashboard/innovations/new"
            className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[13.5px] font-semibold"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <Plus className="h-4 w-4" />
            قدّم ابتكارك الأول
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl p-5"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
            >
              <div className="flex gap-4">
                {s.coverImageUrl && (
                  <div
                    className="h-16 w-16 shrink-0 overflow-hidden rounded-xl"
                    style={{ background: 'var(--mat-liquid-bg)' }}
                  >
                    <Image
                      src={s.coverImageUrl}
                      alt=""
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h2 className="font-outfit font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
                      {s.titleAr}
                    </h2>
                    <StatusChip status={s.status} />
                  </div>

                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {s.summaryAr}
                  </p>

                  <p className="mt-2 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
                    {s.track ? `${s.track} · ` : ''}
                    {s.submittedAt
                      ? `أُرسل في ${new Date(s.submittedAt).toLocaleDateString('ar')}`
                      : `آخر تعديل ${new Date(s.updatedAt).toLocaleDateString('ar')}`}
                  </p>
                </div>
              </div>

              {s.reviewNote && (
                <div
                  className="mt-4 rounded-xl p-4"
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
                    {s.reviewNote}
                  </p>
                </div>
              )}

              <div
                className="mt-4 flex flex-wrap items-center gap-2 pt-3"
                style={{ borderTop: '1px solid var(--mat-liquid-border)' }}
              >
                {s.status === 'DRAFT' && <SubmitForReviewButton id={s.id} />}
                <Link
                  href={`/dashboard/innovations/${s.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold"
                  style={{ background: 'var(--mat-liquid-bg)', color: 'var(--text-secondary)' }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {s.status === 'DRAFT' ? 'تعديل' : 'عرض'}
                </Link>
                <div className="ms-auto">
                  <DeleteButton
                    action={deleteSubmission.bind(null, s.id)}
                    confirmText="حذف هذا المشروع نهائياً؟"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
