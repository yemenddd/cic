import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, TriangleAlert } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { categoryLabel } from '@/lib/categories';
import { badgeToken } from '@/lib/badge-token';
import { dayLabel } from '@/lib/attendance';
import QRCode from '@/components/ui/QRCode';
import StatusChip from '@/components/submissions/StatusChip';
import RoleChip from '../RoleChip';
import UserAdminActions from './UserAdminActions';
import UserProfileForm from './UserProfileForm';
import UserAttendance, { type AttendanceEntry, type CheckpointOption } from './UserAttendance';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [session, user, openCheckpoints] = await Promise.all([
    auth(),
    prisma.user.findUnique({
      where: { id },
      include: {
        submissions: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, titleAr: true, track: true, status: true, submittedAt: true },
        },
        attendance: {
          orderBy: { checkedInAt: 'desc' },
          include: {
            checkpoint: { select: { nameAr: true, day: true } },
            recordedBy: { select: { name: true, email: true } },
          },
        },
        _count: { select: { savedSessions: true, registrations: true, notifications: true } },
      },
    }),
    prisma.checkpoint.findMany({
      where: { isOpen: true },
      orderBy: [{ day: 'asc' }, { order: 'asc' }],
      select: { id: true, nameAr: true, day: true },
    }),
  ]);
  if (!user) notFound();

  const entries: AttendanceEntry[] = user.attendance.map((a) => ({
    id: a.id,
    checkpointName: a.checkpoint.nameAr,
    day: a.checkpoint.day,
    method: a.method,
    checkedInAt: a.checkedInAt.toISOString(),
    recordedBy: a.recordedBy?.name ?? a.recordedBy?.email ?? null,
  }));

  const checkpointOptions: CheckpointOption[] = openCheckpoints.map((c) => ({
    id: c.id,
    label: `${c.nameAr} — ${dayLabel(c.day)}`,
  }));

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

      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <UserProfileForm
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            country: user.country,
            organization: user.organization,
            category: user.category,
            track: user.track,
          }}
        />

        {/* The same symbol the attendee's own badge carries — so an organizer
            can scan this screen when the attendee has no phone and no print,
            without issuing anything new. */}
        <section
          className="rounded-2xl p-6 lg:w-[248px]"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <h2 className="mb-4 font-outfit font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
            بطاقة الحضور
          </h2>

          <div
            className="flex justify-center rounded-xl p-3"
            style={{ background: '#ffffff', border: '1px solid var(--mat-liquid-border)' }}
          >
            <QRCode value={badgeToken(user.id)} size={176} title={`رمز حضور ${user.name ?? user.email}`} />
          </div>

          <div className="mt-4 space-y-1">
            <p className="text-[11.5px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
              رمز التأكيد
            </p>
            <p
              className="font-mono text-[13px] font-bold tracking-wider"
              style={{ color: 'var(--text-primary)' }}
              dir="ltr"
            >
              {user.confirmationCode || '—'}
            </p>
          </div>

          {!user.confirmationCode && (
            <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed" style={{ color: '#f59e0b' }}>
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              لا يملك هذا الحساب رمز تأكيد — يمكن مسحه بالـ QR، لكن لا يمكن البحث عنه بالرمز عند المكتب.
            </p>
          )}

          <dl className="mt-4 space-y-2 pt-4 text-[12px]" style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
            {[
              ['الفئة', categoryLabel(user.category, 'ar') || '—'],
              ['المسار', user.track || '—'],
              ['الانضمام', new Date(user.createdAt).toLocaleDateString('ar')],
              ['التسجيلات', String(user._count.registrations)],
              ['الجلسات المحفوظة', String(user._count.savedSessions)],
              ['الإشعارات', String(user._count.notifications)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <dt style={{ color: 'var(--text-tertiary)' }}>{label}</dt>
                <dd className="truncate" style={{ color: 'var(--text-secondary)' }}>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <UserAttendance userId={user.id} entries={entries} checkpoints={checkpointOptions} />

      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
      >
        <h2 className="font-outfit font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
          الأعمال المقدَّمة
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
        hasCode={Boolean(user.confirmationCode)}
      />
    </div>
  );
}
