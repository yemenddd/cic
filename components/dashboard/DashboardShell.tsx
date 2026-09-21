'use client';

import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, IdCard, CalendarDays, Lightbulb, UserRound,
  LogOut, ExternalLink, Bell, Award,
} from 'lucide-react';
import PlatformShell, { type NavGroup, type UtilAction } from '@/components/platform/PlatformShell';
import { abilitiesFor } from '@/lib/categories';
import { useUnreadCount } from '@/lib/use-unread-count';

export default function DashboardShell({
  name,
  email,
  unreadCount = 0,
  category,
  children,
}: {
  name?: string | null;
  email?: string | null;
  /**
   * Counted by the Server Component layout, so the badge is right on first
   * paint. It is then kept current here — an announcement reaches everybody at
   * once, and a badge that only updates on navigation would tell somebody
   * sitting on their own agenda about it whenever they next clicked something.
   */
  unreadCount?: number;
  category?: string | null;
  children: React.ReactNode;
}) {
  const abilities = abilitiesFor(category);
  const unread = useUnreadCount(unreadCount);

  const groups: NavGroup[] = [
    {
      items: [{ href: '/dashboard', label: 'نظرة عامة', icon: LayoutDashboard, exact: true }],
    },
    {
      label: 'حضوري',
      items: [
        { href: '/dashboard/badge', label: 'بطاقتي', icon: IdCard },
        { href: '/dashboard/agenda', label: 'جدولي', icon: CalendarDays },
        { href: '/dashboard/certificate', label: 'شهادتي', icon: Award },
      ],
    },
    {
      label: 'إبداعي',
      // Only participants may present a project — see abilitiesFor() in
      // lib/categories.ts. An empty group renders nothing at all, so a visitor
      // never sees a heading with no links under it. Hiding the link is
      // cosmetic; the pages and the server actions are what enforce this.
      items: abilities.submitInnovations
        ? [{ href: '/dashboard/innovations', label: 'ابتكاراتي', icon: Lightbulb }]
        : [],
    },
    {
      label: 'حسابي',
      items: [
        { href: '/dashboard/notifications', label: 'الإشعارات', icon: Bell, badge: unread },
        { href: '/dashboard/account', label: 'بياناتي', icon: UserRound },
      ],
    },
  ];

  const actions: UtilAction[] = [
    { label: 'عرض الموقع', icon: ExternalLink, href: '/', external: true },
    { label: 'تسجيل الخروج', icon: LogOut, onClick: () => signOut({ callbackUrl: '/' }) },
  ];

  return (
    <PlatformShell
      title="حسابي في CIC"
      groups={groups}
      actions={actions}
      name={name}
      email={email}
    >
      {children}
    </PlatformShell>
  );
}
