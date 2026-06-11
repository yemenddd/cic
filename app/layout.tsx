import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import StyletronWrapper from "@/components/layout/StyletronWrapper";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LanguageProvider } from "@/lib/i18n";
import ScrollToTop from "@/components/layout/ScrollToTop";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
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

export const metadata: Metadata = {
  title: "CICT 2026 | مؤتمر الإبداع والابتكار الرابع",
  description:
    "انضم إلينا في مؤتمر الإبداع والابتكار الرابع يومي ١٥–١٦ أغسطس ٢٠٢٦. اكتشف مستقبل الابتكار.",
  icons: {
    icon: [
      { url: "/images/logos/logo_colored.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Arabic is the official default language → RTL
    <html
      lang="ar"
      dir="rtl"
      className={`${inter.variable} ${outfit.variable} ${thmanyah.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#000000] text-white font-inter">
        <StyletronWrapper>
          <LanguageProvider>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
            <ScrollToTop />
          </LanguageProvider>
        </StyletronWrapper>
      </body>
    </html>
  );
}
