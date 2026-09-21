import type { Metadata } from "next";
import { Inter, Outfit, IBM_Plex_Sans_Arabic } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import SiteChrome from "@/components/layout/SiteChrome";
import { getSiteSettings } from "@/lib/site-settings-server";
import { LanguageProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme-context";
import { siteUrl } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

// Used only by the platform surfaces (/admin, /dashboard, login screens) via
// the .font-platform utility — the public marketing site keeps its own type.
const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Arabic typeface — Thmanyah Serif Display, self-hosted, used across the site when the language is Arabic
const thmanyah = localFont({
  variable: "--font-thmanyah",
  display: "swap",
  src: [
    { path: "../public/fonts/ar/thmanyahserifdisplay-Light.otf", weight: "300", style: "normal" },
    { path: "../public/fonts/ar/thmanyahserifdisplay-Regular.otf", weight: "400", style: "normal" },
    { path: "../public/fonts/ar/thmanyahserifdisplay-Medium.otf", weight: "500", style: "normal" },
    { path: "../public/fonts/ar/thmanyahserifdisplay-Bold.otf", weight: "700", style: "normal" },
    { path: "../public/fonts/ar/thmanyahserifdisplay-Black.otf", weight: "900", style: "normal" },
  ],
});

const title = "CIC 2026 | مؤتمر الإبداع والابتكار الرابع";
const description =
  "انضم إلينا في مؤتمر الإبداع والابتكار الرابع يومي ٢–٣ أكتوبر ٢٠٢٦. اكتشف مستقبل الابتكار.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s" },
  description,
  icons: {
    icon: [
      { url: "/images/logos/logo_colored.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "CIC 2026",
    locale: "ar_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read here rather than in the footer, which is a Client Component. Only the
  // four links it renders are passed down — the rest of the settings are not
  // the footer's business and would be shipped to every visitor for nothing.
  const settings = await getSiteSettings();
  const social = {
    facebookUrl: settings.facebookUrl,
    instagramUrl: settings.instagramUrl,
    youtubeUrl: settings.youtubeUrl,
    xUrl: settings.xUrl,
    contactEmail: settings.contactEmail,
  };

  return (
    // Arabic is the official default language → RTL
    <html
      lang="ar"
      dir="rtl"
      className={`${inter.variable} ${outfit.variable} ${thmanyah.variable} ${ibmPlexArabic.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-inter" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <ThemeProvider>
          <LanguageProvider>
            <SiteChrome social={social}>{children}</SiteChrome>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
