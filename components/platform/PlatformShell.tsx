'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Sun, Moon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import CICTLogo from '@/components/ui/CICTLogo';
import { useTheme } from '@/lib/theme-context';

/**
 * The frame around both panels — the admin one and the attendee dashboard.
 *
 * It exists because the two were the same 220-line component twice over, so
 * every visual change had to be made in both places and they had already
 * started to drift. What differs between them is data, not structure: a title,
 * a set of nav groups, and a few utility links.
 *
 * Nav items are grouped rather than listed flat. Thirteen undifferentiated
 * links is a list you read; four short labelled groups is a map you scan.
 */

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match the path exactly — for an index route that every sibling extends. */
  exact?: boolean;
  badge?: number;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export interface UtilAction {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  /** Opens in a new tab and keeps the panel where it is. */
  external?: boolean;
}

function isActive(pathname: string | null, item: NavItem): boolean {
  if (!pathname) return false;
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function NavLinks({
  groups,
  pathname,
  onNavigate,
}: {
  groups: NavGroup[];
  pathname: string | null;
  onNavigate?: () => void;
}) {
  // A group whose every item was filtered out (a visitor has no innovations
  // section) must not leave its heading floating above nothing.
  const visible = groups.filter((g) => g.items.length > 0);

  return (
    <nav className="platform-scroll flex-1 -mx-1 px-1">
      {visible.map((group, i) => (
        <div key={group.label ?? `group-${i}`} className="platform-group">
          {group.label && <p className="platform-group-label">{group.label}</p>}

          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  data-active={active}
                  aria-current={active ? 'page' : undefined}
                  className="platform-nav-link"
                >
                  <Icon className="platform-nav-icon h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>

                  {item.badge ? (
                    <span
                      className="ms-auto inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none"
                      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                      aria-label={`${item.badge} غير مقروء`}
                    >
                      {item.badge > 99 ? '+99' : item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Identity({ name, email }: { name?: string | null; email?: string | null }) {
  if (!name && !email) return null;

  // Falls back to the email when there is no name — never to an empty circle.
  const initial = (name?.trim() || email?.trim() || '?').charAt(0).toUpperCase();

  return (
    <div
      className="flex items-center gap-2.5 rounded-xl p-2.5 mb-2"
      style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <span
        aria-hidden
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold"
        style={{ background: 'var(--gradient-brand)', color: '#fff' }}
      >
        {initial}
      </span>
      <div className="min-w-0">
        {name && (
          <p className="truncate text-[12.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {name}
          </p>
        )}
        {email && (
          <p className="truncate text-[10.5px]" style={{ color: 'var(--text-tertiary)' }} dir="ltr">
            {email}
          </p>
        )}
      </div>
    </div>
  );
}

function SidebarFooter({
  name,
  email,
  actions,
  onNavigate,
}: {
  name?: string | null;
  email?: string | null;
  actions: UtilAction[];
  onNavigate?: () => void;
}) {
  const { theme, toggle } = useTheme();

  return (
    <div className="pt-3 mt-3" style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
      <Identity name={name} email={email} />

      <div className="space-y-0.5">
        <button type="button" onClick={toggle} className="platform-util">
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          {theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
        </button>

        {actions.map(({ label, icon: Icon, href, onClick, external }) =>
          href ? (
            <Link
              key={label}
              href={href}
              onClick={external ? undefined : onNavigate}
              target={external ? '_blank' : undefined}
              className="platform-util"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ) : (
            <button key={label} type="button" onClick={onClick} className="platform-util">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

function Brand({ title, height = 28 }: { title: string; height?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <CICTLogo height={height} />
      <span className="font-outfit font-bold text-[13.5px]" style={{ color: 'var(--text-primary)' }}>
        {title}
      </span>
    </div>
  );
}

export default function PlatformShell({
  title,
  groups,
  actions,
  name,
  email,
  children,
}: {
  title: string;
  groups: NavGroup[];
  actions: UtilAction[];
  name?: string | null;
  email?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // The drawer remembers which route it was opened on, rather than storing a
  // plain boolean and closing it from an effect when the route changes. Any
  // navigation — a link, the back gesture — therefore closes it as a matter of
  // arithmetic during render, with no second pass and nothing to keep in sync.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const menuOpen = openedOn !== null && openedOn === pathname;
  const closeMenu = () => setOpenedOn(null);

  // Keeps the page behind the drawer from scrolling while it is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <div className="font-platform flex min-h-screen" style={{ background: 'var(--bg-base)' }} dir="rtl">
      {/* Desktop sidebar — pinned, so a long page never scrolls the nav away. */}
      <aside
        className="hidden md:flex sticky top-0 h-screen w-[248px] shrink-0 flex-col p-4"
        style={{
          background: 'var(--bg-elevated)',
          borderInlineEnd: '1px solid var(--mat-liquid-border)',
        }}
      >
        <div className="px-1.5 pb-4 mb-1">
          <Brand title={title} height={30} />
        </div>
        <NavLinks groups={groups} pathname={pathname} />
        <SidebarFooter name={name} email={email} actions={actions} />
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <div
            className="platform-scrim md:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
            onClick={closeMenu}
          />
          <aside
            className="platform-drawer md:hidden fixed inset-y-0 start-0 z-50 flex w-[280px] flex-col p-4"
            style={{
              background: 'var(--bg-elevated)',
              borderInlineEnd: '1px solid var(--mat-liquid-border)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="flex items-center justify-between pb-4 mb-1">
              <Brand title={title} />
              <button
                type="button"
                onClick={closeMenu}
                aria-label="إغلاق القائمة"
                className="rounded-lg p-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks groups={groups} pathname={pathname} onNavigate={closeMenu} />
            <SidebarFooter
              name={name}
              email={email}
              actions={actions}
              onNavigate={closeMenu}
            />
          </aside>
        </>
      )}

      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <header
          className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
          style={{
            background: 'var(--header-glass-bg)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            borderBottom: '1px solid var(--mat-liquid-border)',
          }}
        >
          <button
            type="button"
            onClick={() => setOpenedOn(pathname)}
            aria-label="فتح القائمة"
            className="rounded-lg p-1"
            style={{ color: 'var(--text-primary)' }}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Brand title={title} height={24} />
        </header>

        <main className="p-5 md:p-8 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
