'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/layout/ScrollToTop';

// The embedded Sanity Studio (/studio) needs the full viewport and manages
// its own chrome — the marketing site's header/footer would only get in the way.
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStudio = pathname?.startsWith('/studio');

  if (isStudio) return <>{children}</>;

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
      <Footer />
      <ScrollToTop />
    </>
  );
}
