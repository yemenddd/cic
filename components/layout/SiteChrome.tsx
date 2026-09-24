'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/layout/ScrollToTop';

// The panels (/admin, /dashboard) and the auth screens carry their own
// chrome — the marketing site's header/footer would only get in the way.
//
// /join is here for a different reason: it is the invitation link, sent to
// people directly, and the point of it is that there is no way from it into
// the rest of the site. A header with eight nav items would defeat it.
const BARE_ROUTES = [
  '/admin', '/dashboard', '/login', '/forgot-password', '/reset-password', '/join',
];

export interface SocialLinks {
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  xUrl: string;
  contactEmail: string;
}

export default function SiteChrome({
  children,
  social,
}: {
  children: React.ReactNode;
  social: SocialLinks;
}) {
  const pathname = usePathname();
  const isBare = BARE_ROUTES.some((r) => pathname?.startsWith(r));

  if (isBare) return <>{children}</>;

  return (
    <>
      <a
        href="#main-content"
        className="fixed top-4 start-4 z-[100] -translate-y-24 focus:translate-y-0 transition-transform rounded-lg px-4 py-2 text-sm font-semibold"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
      >
        تخطَّ إلى المحتوى الرئيسي
      </a>
      <Header />
      <main id="main-content" className="flex-grow">{children}</main>
      <Footer social={social} />
      <ScrollToTop />
    </>
  );
}
