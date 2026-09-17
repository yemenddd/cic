import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Bell, BellOff } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { markAllAsRead, markAsRead } from './actions';
import { MarkAllAsReadButton, MarkAsReadButton } from './MarkReadButtons';

// Arabic-friendly "منذ ..." for recent items, falling back to a plain date.
function relativeArabicDate(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `قبل ${days} يوم`;
  return date.toLocaleDateString('ar');
}

export default async function DashboardNotificationsPage() {
  const session = await auth();
  // The layout guards this too, but a page must never render attendee data on
  // the assumption that something upstream ran.
  if (!session?.user?.id) redirect('/login');

  // Deliberately un-wrapped by safe(): a DB outage must surface as an error
  // rather than a misleading "لا توجد إشعارات".
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
            الإشعارات
          </h1>
          <p className="text-[12.5px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {unread > 0 ? `لديك ${unread} إشعار غير مقروء` : 'كل إشعاراتك مقروءة'}
          </p>
        </div>
        {unread > 0 && <MarkAllAsReadButton action={markAllAsRead} />}
      </div>

      {notifications.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-14 text-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'var(--mat-liquid-bg)' }}
          >
            <BellOff className="h-6 w-6" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <p className="font-outfit font-bold text-[15px] mb-2" style={{ color: 'var(--text-primary)' }}>
            لا توجد إشعارات بعد
          </p>
          <p className="text-[13px] max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
            سنُعلمك هنا فور صدور قرار اللجنة على مشاريعك، وعند أي جديد يخص حسابك في المؤتمر.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="rounded-2xl p-5"
              style={{
                background: n.read ? 'var(--bg-elevated)' : 'var(--mat-liquid-bg)',
                border: '1px solid var(--mat-liquid-border)',
                borderInlineStartWidth: n.read ? '1px' : '3px',
                borderInlineStartColor: n.read ? 'var(--mat-liquid-border)' : 'var(--primary)',
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: n.read ? 'var(--mat-liquid-bg)' : 'var(--primary)',
                    color: n.read ? 'var(--text-tertiary)' : 'var(--primary-foreground)',
                  }}
                >
                  <Bell className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      className="font-outfit text-[14.5px]"
                      style={{
                        color: 'var(--text-primary)',
                        fontWeight: n.read ? 600 : 700,
                      }}
                    >
                      {n.title}
                    </h2>
                    {!n.read && (
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: 'var(--primary)' }}
                        aria-label="غير مقروء"
                      />
                    )}
                  </div>

                  {n.body && (
                    <p
                      className="mt-1.5 text-[13px] leading-relaxed whitespace-pre-line"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {n.body}
                    </p>
                  )}

                  <p className="mt-2 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
                    {relativeArabicDate(n.createdAt)}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {n.link && (
                      <Link
                        href={n.link}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold"
                        style={{ background: 'var(--mat-liquid-bg)', color: 'var(--text-primary)' }}
                      >
                        عرض التفاصيل
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </Link>
                    )}
                    {!n.read && <MarkAsReadButton action={markAsRead.bind(null, n.id)} />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
