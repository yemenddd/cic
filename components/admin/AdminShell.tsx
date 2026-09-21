'use client';

import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, Mic2, CalendarDays, Images, Handshake,
  History, Trophy, Clapperboard, ClipboardList, Lightbulb, Users, BarChart3,
  LogOut, Megaphone, KeyRound, ExternalLink, ScanLine, PanelsTopLeft, Settings,
} from 'lucide-react';
import PlatformShell, { type NavGroup, type UtilAction } from '@/components/platform/PlatformShell';

// Grouped by what the organizer is trying to do, not by when each section was
// built: everything that edits the public site, then everything about the
// people attending, then the outward and analytical tools.
const GROUPS: NavGroup[] = [
  {
    items: [{ href: '/admin', label: 'نظرة عامة', icon: LayoutDashboard, exact: true }],
  },
  {
    // The seven sections of the public site, behind one entry.
    //
    // Listed flat they were half of a fourteen-item sidebar, which defeats the
    // grouping: a map you scan only works while it is shorter than the list it
    // replaced. They are also the part an organiser touches least once the
    // site is written — the day-to-day work is registrations, submissions and
    // attendance, and those stay in plain sight.
    label: 'محتوى الموقع',
    collapsible: true,
    icon: PanelsTopLeft,
    items: [
      { href: '/admin/speakers', label: 'المتحدثون', icon: Mic2 },
      { href: '/admin/program', label: 'البرنامج', icon: CalendarDays },
      { href: '/admin/gallery', label: 'المعرض', icon: Images },
      { href: '/admin/partners', label: 'الشركاء', icon: Handshake },
      { href: '/admin/history', label: 'رحلة المؤتمر', icon: History },
      { href: '/admin/achievements', label: 'الإنجازات', icon: Trophy },
      { href: '/admin/videos', label: 'الفيديوهات', icon: Clapperboard },
      // Last in the group: it is the one entry that changes the site's
      // behaviour rather than its content, and closing registration from here
      // is the thing an organizer will come looking for.
      { href: '/admin/settings', label: 'إعدادات الموقع', icon: Settings },
    ],
  },
  {
    label: 'المشاركون',
    items: [
      { href: '/admin/registrations', label: 'التسجيلات', icon: ClipboardList },
      { href: '/admin/submissions', label: 'الابتكارات المقدَّمة', icon: Lightbulb },
      { href: '/admin/users', label: 'المستخدمون', icon: Users },
      { href: '/admin/attendance', label: 'الحضور', icon: ScanLine },
    ],
  },
  {
    label: 'التواصل والقياس',
    items: [
      { href: '/admin/announcements', label: 'الإعلانات', icon: Megaphone },
      { href: '/admin/insights', label: 'الإحصاءات', icon: BarChart3 },
    ],
  },
];

export default function AdminShell({
  name,
  email,
  children,
}: {
  name?: string | null;
  email?: string | null;
  children: React.ReactNode;
}) {
  const actions: UtilAction[] = [
    { label: 'تغيير كلمة المرور', icon: KeyRound, href: '/admin/account' },
    { label: 'عرض الموقع', icon: ExternalLink, href: '/', external: true },
    { label: 'تسجيل الخروج', icon: LogOut, onClick: () => signOut({ callbackUrl: '/admin/login' }) },
  ];

  return (
    <PlatformShell title="لوحة CICT" groups={GROUPS} actions={actions} name={name} email={email}>
      {children}
    </PlatformShell>
  );
}
