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
  title: {
    default: "Best PG in Ahmedabad | Luxora PG - Luxury Boys & Girls Stay",
    template: "%s | Luxora PG",
  },
  description:
    "Looking for the best PG in Ahmedabad? Luxora PG offers premium, fully-furnished boys and girls PG accommodation in Satellite, Navrangpura, Vastrapur & Thaltej with 3-time meals, high-speed Wi-Fi, 24/7 security, AC & zero brokerage.",
  keywords: [
    "PG in Ahmedabad",
    "Best PG in Ahmedabad",
    "Boys PG in Ahmedabad",
    "Girls PG in Ahmedabad",
    "Paying Guest in Ahmedabad",
    "Luxury PG Ahmedabad",
    "Easy PG Ahmedabad",
    "PG near Satellite Ahmedabad",
    "PG in Navrangpura",
    "PG in Vastrapur",
    "PG in Thaltej",
    "PG with food in Ahmedabad",
    "Student PG Ahmedabad",
    "Hostel in Ahmedabad",
    "Single room PG Ahmedabad",
    "Double sharing PG Ahmedabad",
  ],
  alternates: { canonical: "./" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "Luxora PG - Best PG in Ahmedabad",
    locale: "en_IN",
    url: SITE.url,
    title: "Best PG in Ahmedabad | Luxora PG (Easy PG)",
    description: "Premium boys and girls PG accommodation across top Ahmedabad localities with hygienic food, Wi-Fi, AC, and 24/7 security.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best PG in Ahmedabad | Luxora PG",
    description: "Premium boys and girls PG accommodation in Ahmedabad with hygienic food, Wi-Fi, and 24/7 security.",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  other: {
    "geo.region": "IN-GJ",
    "geo.placename": "Ahmedabad",
    "geo.position": "23.0225;72.5714",
    ICBM: "23.0225, 72.5714",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/favicon.svg",
    apple: "/images/luxora-emblem.png",
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#101426" }, { media: "(prefers-color-scheme: light)", color: "#FAF8F4" }],
};

const themeScript = `(function(){try{var t=localStorage.getItem('luxora-theme')||localStorage.getItem('sorath-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);var p=localStorage.getItem('luxora-palette')||localStorage.getItem('sorath-palette')||'royal';document.documentElement.setAttribute('data-palette',p);}catch(e){}if(typeof window!=='undefined'){window.addEventListener('unhandledrejection',function(e){if(e.reason&&(e.reason instanceof Event||Object.prototype.toString.call(e.reason)==='[object Event]')){e.preventDefault();console.warn('Prevented unhandled DOM Event overlay:',e.reason);}});}})();`;

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
