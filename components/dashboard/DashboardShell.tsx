'use client';

import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, IdCard, CalendarDays, Lightbulb, UserRound,
  LogOut, ExternalLink, Bell, Award,
} from 'lucide-react';
import PlatformShell, { type NavGroup, type UtilAction } from '@/components/platform/PlatformShell';
import { abilitiesFor } from '@/lib/categories';

export default function DashboardShell({
  name,
  email,
  unreadCount = 0,
  category,
  children,
}: {
  name?: string | null;
  email?: string | null;
  // Fetched by the Server Component layout — this client shell never queries.
  unreadCount?: number;
  category?: string | null;
  children: React.ReactNode;
}) {
  const abilities = abilitiesFor(category);

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
        { href: '/dashboard/notifications', label: 'الإشعارات', icon: Bell, badge: unreadCount },
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
      title="حسابي في CICT"
      groups={groups}
      actions={actions}
      name={name}
      email={email}
    >
      {children}
    </PlatformShell>
  );
}
