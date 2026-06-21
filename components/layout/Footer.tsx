"use client";

import Image from "next/image";
import { Footer as FooterBase } from "@/components/ui/footer";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme-context";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.43-4.94 8.43-9.94Z" />
    </svg>
  );
}
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
    </svg>
  );
}
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.53A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12c1.88.53 9.38.53 9.38.53s7.5 0 9.38-.53a3 3 0 0 0 2.12-2.12A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    </svg>
  );
}

export default function Footer() {
  const { t } = useLang();
  const { theme } = useTheme();

  const C4Logo = (
    <Image
      src={theme === 'light' ? '/images/logos/logo_colored.png' : '/images/logos/logo_white.png'}
      alt="CICT 2026 logo"
      width={40}
      height={40}
      className="h-10 w-10 object-contain"
    />
  );

  return (
    <div style={{ color: 'var(--text-primary)', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)' }}>
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
    <FooterBase
      logo={C4Logo}
      brandName={t("footer.copyright")}
      socialLinks={[
        { icon: <FacebookIcon className="h-5 w-5" />, href: "https://www.facebook.com/yemenddd", label: "Facebook" },
        { icon: <InstagramIcon className="h-5 w-5" />, href: "https://www.instagram.com/yemen.ddd", label: "Instagram" },
        { icon: <YoutubeIcon className="h-5 w-5" />, href: "https://www.youtube.com/channel/UCwnyiuNKFCSQpvk50-m1sWg", label: "YouTube" },
        { icon: <XIcon className="h-5 w-5" />, href: "https://x.com/yemenddd", label: "X" },
      ]}
      mainLinks={[
        { href: "/", label: t("nav.home") },
        { href: "/about", label: t("nav.about") },
        { href: "/history", label: t("nav.history") },
        { href: "/program", label: t("nav.program") },
        { href: "/gallery", label: t("nav.gallery") },
      ]}
      legalLinks={[]}
      copyright={{
        text: `© 2026 ${t("footer.license")} - ${t("footer.copyright")}`,
      }}
    />
    </div>
    </div>
  );
}
