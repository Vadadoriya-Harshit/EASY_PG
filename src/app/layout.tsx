import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "./globals.css";
import { SITE } from "@/lib/site";
import { isDemoStore } from "@/lib/repo";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CompareProvider, CompareBar } from "@/components/Compare";
import WhatsAppFab from "@/components/WhatsAppFab";
import ThemeCustomizerSideIcon from "@/components/ThemeCustomizerSideIcon";
import RouteTransitionLoader from "@/components/RouteTransitionLoader";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Luxora PG | Feel At Home, Live In Luxury", template: "%s | Luxora PG" },
  description: "Luxora PG — Feel At Home, Live In Luxury. Find premium boys and girls PG accommodation in Ahmedabad with high-speed Wi-Fi, hygienic food, 24/7 security, and transparent rent.",
  // Self-referencing canonical for every page that does not set its own. OG title/description are left to each page
  // (crawlers fall back to the page <title> and meta description) so shares never show the homepage text.
  alternates: { canonical: "./" },
  openGraph: { type: "website", siteName: "Luxora PG", locale: "en_IN" },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: "/icon.svg",
    shortcut: "/favicon.svg",
    apple: "/images/luxora-emblem.png",
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#101426" }, { media: "(prefers-color-scheme: light)", color: "#FAF8F4" }],
};

const themeScript = `(function(){try{var t=localStorage.getItem('luxora-theme')||localStorage.getItem('sorath-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);var p=localStorage.getItem('luxora-palette')||localStorage.getItem('sorath-palette')||'royal';document.documentElement.setAttribute('data-palette',p);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const demo = isDemoStore();
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="relative min-h-screen bg-bg text-ink transition-colors duration-300">
        {/* Living Ambient 3D Animated Spatial Depth Aura across all pages */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-32 -left-32 h-[580px] w-[580px] rounded-full bg-brand/12 blur-[140px] animate-ambient-drift opacity-80" />
          <div className="absolute top-1/4 -right-32 h-[540px] w-[540px] rounded-full bg-accent/12 blur-[150px] animate-ambient-drift-rev opacity-75" />
          <div className="absolute top-2/3 -left-20 h-[480px] w-[480px] rounded-full bg-purple-600/10 blur-[130px] animate-ambient-drift opacity-70" />
          <div className="absolute -bottom-32 left-1/3 h-[620px] w-[620px] rounded-full bg-brand/10 blur-[160px] animate-ambient-drift-rev opacity-70" />
        </div>

        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white">Skip to content</a>
        <CompareProvider>
          <Navbar />
          <main id="main">{children}</main>
          <Footer demo={demo} />
          <CompareBar />
          <WhatsAppFab />
          <ThemeCustomizerSideIcon />
          <Suspense fallback={null}>
            <RouteTransitionLoader />
          </Suspense>
        </CompareProvider>
      </body>
    </html>
  );
}
