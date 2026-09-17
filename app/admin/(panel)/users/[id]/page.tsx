import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { categoryLabel } from '@/lib/categories';
import StatusChip from '@/components/submissions/StatusChip';
import RoleChip from '../RoleChip';
import UserAdminActions from './UserAdminActions';

function Field({ label, value, dir }: { label: string; value?: string | null; dir?: 'ltr' | 'rtl' }) {
  return (
    <div>
      <p className="mb-1 text-[11.5px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-primary)' }} dir={dir}>
        {value || '—'}
      </p>
    </div>
  );
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [session, user] = await Promise.all([
    auth(),
    prisma.user.findUnique({
      where: { id },
      include: {
        submissions: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, titleAr: true, track: true, status: true, submittedAt: true },
        },
        _count: { select: { savedSessions: true, registrations: true } },
      },
    }),
  ]);
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" style={{ color: 'var(--text-tertiary)' }} aria-label="رجوع">
          <ArrowRight className="h-5 w-5 rotate-180" />
        </Link>
        <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
          {user.name || user.email}
        </h1>
        <RoleChip role={user.role} />
      </div>

      <div
        className="rounded-2xl p-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
      >
        <Field label="الاسم" value={user.name} />
        <Field label="البريد الإلكتروني" value={user.email} dir="ltr" />
        <Field label="رقم الهاتف" value={user.phone} dir="ltr" />
        <Field label="الدولة" value={user.country} />
        <Field label="الجهة" value={user.organization} />
        <Field label="الفئة" value={categoryLabel(user.category, 'ar')} />
        <Field label="المسار" value={user.track} />
        <Field label="رمز التأكيد" value={user.confirmationCode} dir="ltr" />
        <Field label="تاريخ الانضمام" value={new Date(user.createdAt).toLocaleDateString('ar')} />
        <Field
          label="النشاط"
          value={`${user.submissions.length} ابتكار · ${user._count.savedSessions} جلسة محفوظة · ${user._count.registrations} تسجيل`}
        />
      </div>

      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
      >
        <h2 className="font-outfit font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
          الابتكارات المقدَّمة
        </h2>

        {user.submissions.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            لم يقدّم هذا المستخدم أي ابتكار بعد
          </p>
        ) : (
          <ul className="space-y-2">
            {user.submissions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/admin/submissions/${s.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
                >
                  <span className="min-w-0">
                    <span className="block text-[13.5px]" style={{ color: 'var(--text-primary)' }}>
                      {s.titleAr}
                    </span>
                    <span className="block text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
                      {s.track || 'بدون مسار'}
                      {s.submittedAt ? ` · أُرسل في ${new Date(s.submittedAt).toLocaleDateString('ar')}` : ''}
                    </span>
                  </span>
                  <StatusChip status={s.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <UserAdminActions
        userId={user.id}
        role={user.role}
        category={user.category}
        isSelf={session?.user?.id === user.id}
      />
    </div>
  );
}
