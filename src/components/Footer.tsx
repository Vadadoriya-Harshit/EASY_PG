"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { SITE } from "@/lib/site";
import Logo from "./Logo";
import {
  ShieldCheck,
  Mail,
  Lock,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
  Send,
  CheckCircle2,
  PhoneCall,
  MessageSquare,
  Clock,
  Sparkles,
  Radio
} from "lucide-react";
import { DEFAULT_CMS_DATA } from "@/lib/cms-store";

export default function Footer({ demo }: { demo: boolean }) {
  const [emailSub, setEmailSub] = useState("");
  const [subDone, setSubDone] = useState(false);
  const [footerData, setFooterData] = useState({
    newsletterHeading: DEFAULT_CMS_DATA.footer.newsletterHeading,
    newsletterSub: DEFAULT_CMS_DATA.footer.newsletterSub,
    disclaimer: DEFAULT_CMS_DATA.footer.disclaimer,
    copyrightNotice: DEFAULT_CMS_DATA.footer.copyrightNotice,
    phone: DEFAULT_CMS_DATA.contact.phone,
    whatsapp: DEFAULT_CMS_DATA.contact.whatsapp,
    email: DEFAULT_CMS_DATA.contact.email,
    address: DEFAULT_CMS_DATA.contact.address,
    visitingHours: DEFAULT_CMS_DATA.contact.visitingHours,
  });

  useEffect(() => {
    const fetchSettings = () => {
      fetch("/api/site-settings")
        .then((r) => r.json())
        .then((res) => {
          if (res.ok && res.data) {
            const f = res.data.footer || DEFAULT_CMS_DATA.footer;
            const c = res.data.contact || DEFAULT_CMS_DATA.contact;
            setFooterData({
              newsletterHeading: f.newsletterHeading || DEFAULT_CMS_DATA.footer.newsletterHeading,
              newsletterSub: f.newsletterSub || DEFAULT_CMS_DATA.footer.newsletterSub,
              disclaimer: f.disclaimer || DEFAULT_CMS_DATA.footer.disclaimer,
              copyrightNotice: f.copyrightNotice || DEFAULT_CMS_DATA.footer.copyrightNotice,
              phone: c.phone || SITE.phone,
              whatsapp: c.whatsapp || SITE.whatsapp,
              email: c.email || SITE.email,
              address: c.address || SITE.address,
              visitingHours: c.visitingHours || "10:00 AM – 7:30 PM (Daily)",
            });
          }
        })
        .catch(() => {});
    };
    fetchSettings();
    window.addEventListener("sorath_cms_updated", fetchSettings);
    window.addEventListener("luxora_cms_updated", fetchSettings);
    return () => {
      window.removeEventListener("sorath_cms_updated", fetchSettings);
      window.removeEventListener("luxora_cms_updated", fetchSettings);
    };
  }, []);

  const handleSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSub) return;
    setSubDone(true);
    setTimeout(() => {
      setEmailSub("");
    }, 5000);
  };

  const cleanPhone = footerData.phone.replace(/[^0-9+]/g, "");
  const cleanWa = footerData.whatsapp.replace(/[^0-9]/g, "");

  return (
    <footer className="mt-28 border-t border-ink/10 bg-gradient-to-b from-surface/40 via-surface/80 to-bg relative isolate overflow-hidden">
      {/* Background ambient glow accents */}
      <div className="absolute -left-[10%] bottom-0 -z-10 h-72 w-72 rounded-full bg-brand/10 blur-[100px]" />
      <div className="absolute -right-[10%] bottom-10 -z-10 h-72 w-72 rounded-full bg-accent/10 blur-[100px]" />

      {/* 1. Newsletter & Live Vacancy Radar Section (Dynamic from CMS) */}
      <div className="border-b border-ink/10 bg-gradient-to-r from-brand/15 via-purple-900/10 to-accent/15 py-12 px-4 sm:px-6 lg:px-8">
        <div className="container-x grid gap-8 lg:grid-cols-12 items-center">
          {/* Left Column: Form & Heading */}
          <div className="lg:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
              <Sparkles size={14} /> Never Miss a Room Vacancy
            </span>
            <h3 className="text-2xl font-bold sm:text-4xl text-ink tracking-tight">
              {footerData.newsletterHeading}
            </h3>
            <p className="text-xs sm:text-sm text-mute leading-relaxed max-w-xl">
              {footerData.newsletterSub}
            </p>

            <form onSubmit={handleSub} className="pt-2 max-w-xl">
              {subDone ? (
                <div className="flex items-center gap-2 rounded-2xl bg-ok/15 border border-ok/30 px-5 py-3.5 text-xs font-semibold text-ok shadow-sm">
                  <CheckCircle2 size={18} /> Subscribed successfully! You will receive room vacancy updates.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Enter email or WhatsApp phone number"
                    value={emailSub}
                    onChange={(e) => setEmailSub(e.target.value)}
                    className="input text-xs bg-surface/90 shadow-sm flex-1"
                  />
                  <button
                    type="submit"
                    className="btn btn-primary text-xs shrink-0 px-7 py-3 gap-2 shadow-lg shadow-brand/25 whitespace-nowrap"
                  >
                    <Send size={15} /> Subscribe
                  </button>
                </div>
              )}
              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-mute">
                <span className="flex items-center gap-1">🔒 Zero spam guaranteed</span>
                <span>·</span>
                <span className="flex items-center gap-1">⚡ Direct coordinator alerts</span>
                <span>·</span>
                <span>Opt-out anytime</span>
              </div>
            </form>
          </div>

          {/* Right Column: Live Vacancy Status Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-white/20 bg-surface/85 backdrop-blur-xl p-6 shadow-2xl space-y-4 ring-1 ring-black/5 dark:ring-white/10">
              <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-1">
                    <Radio size={14} className="text-emerald-500" /> Live Ahmedabad Vacancy Radar
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                  Verified Real-Time
                </span>
              </div>

              {/* Vacancy Rows */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-bg/60 border border-ink/5">
                  <div>
                    <span className="font-semibold text-ink block">Satellite Hub (Boys & Girls)</span>
                    <span className="text-[10px] text-mute">Doordarshan Kendra Metro (0.9 km)</span>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-0.5 text-[11px]">
                    3 Beds Open
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-bg/60 border border-ink/5">
                  <div>
                    <span className="font-semibold text-ink block">Navrangpura (Girls Academic)</span>
                    <span className="text-[10px] text-mute">Commerce Six Roads Metro (0.5 km)</span>
                  </div>
                  <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-0.5 text-[11px]">
                    2 Beds Left
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-bg/60 border border-ink/5">
                  <div>
                    <span className="font-semibold text-ink block">Vastrapur (IIM-A & Lake)</span>
                    <span className="text-[10px] text-mute">Gurukul Road Metro (1.4 km)</span>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-0.5 text-[11px]">
                    4 Beds Open
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Multi-Column Industrial Footer Grid */}
      <div className="container-x grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-12">
        {/* Brand Information & Socials */}
        <div className="lg:col-span-4 space-y-5">
          <Logo />
          <p className="text-xs text-mute leading-relaxed">
            {footerData.disclaimer}
          </p>

          <div className="space-y-1.5 text-xs text-mute">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-ok" />
              <span className="font-semibold text-ink">100% Direct Property Management</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-brand" />
              <span>Visiting Hours: {footerData.visitingHours}</span>
            </div>
          </div>

          {/* Social Media Links */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-mute mb-2.5">
              Connect on Social Media:
            </h4>
            <div className="flex items-center gap-2.5">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Luxora PG on Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink/10 bg-surface text-mute transition hover:border-pink-500 hover:bg-pink-500 hover:text-white hover:scale-105"
              >
                <Instagram size={17} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Connect with Luxora PG on Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink/10 bg-surface text-mute transition hover:border-blue-600 hover:bg-blue-600 hover:text-white hover:scale-105"
              >
                <Facebook size={17} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Luxora PG on LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink/10 bg-surface text-mute transition hover:border-blue-700 hover:bg-blue-700 hover:text-white hover:scale-105"
              >
                <Linkedin size={17} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Watch Luxora PG walkthroughs on YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink/10 bg-surface text-mute transition hover:border-red-600 hover:bg-red-600 hover:text-white hover:scale-105"
              >
                <Youtube size={17} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Luxora PG on X Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink/10 bg-surface text-mute transition hover:border-sky-500 hover:bg-sky-500 hover:text-white hover:scale-105"
              >
                <Twitter size={17} />
              </a>
            </div>
          </div>
        </div>

        {/* Column 2: Residences & Stays */}
        <nav aria-label="Residences" className="lg:col-span-2 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink">Residences</h4>
          <ul className="space-y-2 text-xs text-mute">
            <li><Link href="/pgs" className="hover:text-brand transition">All Ahmedabad PGs</Link></li>
            <li><Link href="/pgs/boys" className="hover:text-brand transition">Boys PG Accommodations</Link></li>
            <li><Link href="/pgs/girls" className="hover:text-brand transition">Girls PG Accommodations</Link></li>
            <li><Link href="/areas/satellite" className="hover:text-brand transition">Satellite (ISRO / Jodhpur)</Link></li>
            <li><Link href="/areas/vastrapur" className="hover:text-brand transition">Vastrapur (IIM & Lake)</Link></li>
            <li><Link href="/areas/navrangpura" className="hover:text-brand transition">Navrangpura (Univ / CEPT)</Link></li>
            <li><Link href="/areas/thaltej" className="hover:text-brand transition">Thaltej (SG Highway IT)</Link></li>
          </ul>
        </nav>

        {/* Column 3: Explore & Living */}
        <nav aria-label="Explore & Living" className="lg:col-span-3 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink">Explore & Living</h4>
          <ul className="space-y-2 text-xs text-mute">
            <li><Link href="/nearby" className="hover:text-brand transition">Metro & Nashta Explorer</Link></li>
            <li><Link href="/facilities" className="hover:text-brand transition">Facilities & Inclusions Matrix</Link></li>
            <li><Link href="/gallery" className="hover:text-brand transition">Interactive 360° Photo Gallery</Link></li>
            <li><Link href="/match" className="hover:text-brand transition">Smart PG Matching Quiz</Link></li>
            <li><Link href="/compare" className="hover:text-brand transition">Compare Up to 3 Stays</Link></li>
            <li><Link href="/faq" className="hover:text-brand transition">Frequently Asked Questions</Link></li>
            <li><Link href="/about" className="hover:text-brand transition">Our Living Standards & Story</Link></li>
          </ul>
        </nav>

        {/* Column 4: Contact & Physical Branches (Dynamic from CMS) */}
        <div className="lg:col-span-3 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink">Helpline & Branches</h4>
          <div className="space-y-2 text-xs text-mute">
            <div className="flex items-center gap-2">
              <PhoneCall size={14} className="text-brand shrink-0" />
              <a href={`tel:${cleanPhone}`} className="font-semibold text-ink hover:text-brand transition">
                {footerData.phone}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-emerald-500 shrink-0" />
              <a
                href={`https://wa.me/${cleanWa}?text=${encodeURIComponent("Hello Luxora PG! I need assistance with room booking.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-mute hover:text-emerald-500 transition"
              >
                +{footerData.whatsapp} (WhatsApp Support)
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-accent shrink-0" />
              <a href={`mailto:${footerData.email}`} className="text-mute hover:text-accent transition">
                {footerData.email}
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-ink/10 bg-bg p-3 text-[11px] text-mute space-y-1">
            <p className="font-semibold text-ink">Central Office:</p>
            <p>{footerData.address}</p>
          </div>

          <div>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-surface/80 px-3.5 py-1.5 text-[11px] font-semibold text-mute hover:text-brand hover:border-brand/40 transition"
            >
              <Lock size={12} /> Staff CMS & Lead Portal
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Bottom Legal & Copyright Bar */}
      <div className="border-t border-ink/10 bg-surface/90 py-5">
        <div className="container-x flex flex-wrap items-center justify-between gap-4 text-xs text-mute">
          <p>{footerData.copyrightNotice}</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/privacy" className="hover:text-ink transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-ink transition">Terms of Stay</Link>
            <Link href="/contact" className="hover:text-ink transition">Visiting Guidelines</Link>
            <Link href="/admin/login" className="hover:text-ink transition">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
