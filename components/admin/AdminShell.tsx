'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, Mic2, CalendarDays, Images, Handshake,
  History, Trophy, Clapperboard, ClipboardList, LogOut,
} from 'lucide-react';
import CICTLogo from '@/components/ui/CICTLogo';

const NAV = [
  { href: '/admin', label: 'نظرة عامة', icon: LayoutDashboard, exact: true },
  { href: '/admin/speakers', label: 'المتحدثون', icon: Mic2 },
  { href: '/admin/program', label: 'البرنامج', icon: CalendarDays },
  { href: '/admin/gallery', label: 'المعرض', icon: Images },
  { href: '/admin/partners', label: 'الشركاء', icon: Handshake },
  { href: '/admin/history', label: 'رحلة المؤتمر', icon: History },
  { href: '/admin/achievements', label: 'الإنجازات', icon: Trophy },
  { href: '/admin/videos', label: 'الفيديوهات', icon: Clapperboard },
  { href: '/admin/registrations', label: 'التسجيلات', icon: ClipboardList },
];

export default function AdminShell({ email, children }: { email?: string | null; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }} dir="rtl">
      {/* Sidebar */}
      <aside
        className="hidden md:flex w-64 shrink-0 flex-col p-5"
        style={{ background: '#161618', borderInlineEnd: '1px solid var(--mat-liquid-border)' }}
      >
        <div className="flex items-center gap-2 mb-8 px-1">
          <CICTLogo height={30} />
          <span className="font-outfit font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            لوحة CICT
          </span>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors"
                style={{
                  background: active ? 'var(--mat-liquid-bg)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
          {email && (
            <p className="px-3 mb-2 text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }} dir="ltr">
              {email}
            </p>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <main className="p-5 md:p-8 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
