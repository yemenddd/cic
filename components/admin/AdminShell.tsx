'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, Mic2, CalendarDays, Images, Handshake,
  History, Trophy, Clapperboard, ClipboardList, Lightbulb, LogOut,
  Menu, X, Sun, Moon, KeyRound, ExternalLink,
} from 'lucide-react';
import CICTLogo from '@/components/ui/CICTLogo';
import { useTheme } from '@/lib/theme-context';

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
  { href: '/admin/submissions', label: 'الابتكارات المقدَّمة', icon: Lightbulb },
];

function NavLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
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
  );
}

function SidebarFooter({ email, onNavigate }: { email?: string | null; onNavigate?: () => void }) {
  const { theme, toggle } = useTheme();

  return (
    <div className="pt-4 mt-4 space-y-1" style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
      {email && (
        <p className="px-3 mb-2 text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }} dir="ltr">
          {email}
        </p>
      )}

      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
      </button>

      <Link
        href="/admin/account"
        onClick={onNavigate}
        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <KeyRound className="h-4 w-4" />
        تغيير كلمة المرور
      </Link>

      <Link
        href="/"
        target="_blank"
        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ExternalLink className="h-4 w-4" />
        عرض الموقع
      </Link>

      <button
        onClick={() => signOut({ callbackUrl: '/admin/login' })}
        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <LogOut className="h-4 w-4" />
        تسجيل الخروج
      </button>
    </div>
  );
}

export default function AdminShell({ email, children }: { email?: string | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Every link inside the drawer closes it via onNavigate, so this only needs
  // to keep the page behind the drawer from scrolling while it's open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="font-platform flex min-h-screen" style={{ background: 'var(--bg-base)' }} dir="rtl">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-64 shrink-0 flex-col p-5"
        style={{ background: 'var(--bg-elevated)', borderInlineEnd: '1px solid var(--mat-liquid-border)' }}
      >
        <div className="flex items-center gap-2 mb-8 px-1">
          <CICTLogo height={30} />
          <span className="font-outfit font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            لوحة CICT
          </span>
        </div>
        <NavLinks pathname={pathname} />
        <SidebarFooter email={email} />
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className="md:hidden fixed inset-y-0 start-0 z-50 w-72 flex flex-col p-5 overflow-y-auto"
            style={{ background: 'var(--bg-elevated)', borderInlineEnd: '1px solid var(--mat-liquid-border)' }}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <CICTLogo height={28} />
                <span className="font-outfit font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  لوحة CICT
                </span>
              </div>
              <button onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" style={{ color: 'var(--text-secondary)' }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            <SidebarFooter email={email} onNavigate={() => setMenuOpen(false)} />
          </aside>
        </>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <header
          className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
          style={{
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--mat-liquid-border)',
          }}
        >
          <button onClick={() => setMenuOpen(true)} aria-label="فتح القائمة" style={{ color: 'var(--text-primary)' }}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-outfit font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            لوحة CICT
          </span>
        </header>

        <main className="p-5 md:p-8 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
