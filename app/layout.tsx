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

const title = "CIC | مؤتمر الإبداع والابتكار";
const description =
  "انضم إلينا في مؤتمر الإبداع والابتكار يومي ٢–٣ أكتوبر ٢٠٢٦. اكتشف مستقبل الابتكار.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s" },
  description,
  icons: {
    icon: [
      // Both point at the square mark. The light one used to point at the
      // colour logo in /public, which is now a 3.5:1 lockup — a favicon is
      // drawn into a square, so a wide lockup arrives as an unreadable sliver.
      { url: "/icon.png" },
    ],
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "CIC",
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
      <head>
        {/*
          Decide light or dark before anything is painted.

          The theme used to be applied from an effect, which runs after the
          first paint — so every visitor whose device is set to light opened to
          a dark page that then flipped. This runs synchronously in <head>,
          before the body exists, so the correct theme is the only one ever
          drawn.

          It reads the same key and the same rules as lib/theme-context.tsx,
          and the two must not drift: the absence of a stored preference means
          "follow this device", not "dark".
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var m=localStorage.getItem('cic-theme')||localStorage.getItem('cict-theme')||'system';
              if(m!=='light'&&m!=='dark')m=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';
              document.documentElement.setAttribute('data-theme',m);
            }catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`,
          }}
        />
      </head>
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
